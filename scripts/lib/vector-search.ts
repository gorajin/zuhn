import type Database from "better-sqlite3";
import * as sqliteVec from "sqlite-vec";
import { searchInsights } from "./search";

// ─── Types ──────────────────────────────────────────────────────────

export interface VectorResult {
  id: string;
  distance: number;
}

export interface HybridResult {
  id: string;
  title: string;
  one_line: string;
  domain: string;
  topic: string;
  tags: string;
  score: number;
  confidence: string;
  file_path: string;
  match_type: "both" | "keyword" | "semantic";
}

export interface HybridOptions {
  limit?: number; // default 10
  domain?: string;
  tag?: string;
}

// ─── initVectorTable ────────────────────────────────────────────────

/**
 * Load the sqlite-vec extension and create the embeddings virtual table.
 * Safe to call multiple times (uses IF NOT EXISTS).
 */
export function initVectorTable(db: Database.Database): void {
  sqliteVec.load(db);

  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS embeddings USING vec0(
      id TEXT PRIMARY KEY,
      embedding FLOAT[768] distance_metric=cosine
    );
  `);
}

// ─── upsertEmbedding ───────────────────────────────────────────────

/**
 * Insert or replace an embedding for a given insight ID.
 * vec0 does not support INSERT OR REPLACE, so we delete first.
 */
export function upsertEmbedding(
  db: Database.Database,
  id: string,
  embedding: number[]
): void {
  const embeddingJson = JSON.stringify(embedding);

  // Delete existing row if present (vec0 doesn't support ON CONFLICT)
  db.prepare("DELETE FROM embeddings WHERE id = ?").run(id);
  db.prepare("INSERT INTO embeddings(id, embedding) VALUES (?, ?)").run(
    id,
    embeddingJson
  );
}

// ─── vectorSearch ───────────────────────────────────────────────────

/**
 * Find the nearest neighbors by cosine distance.
 * Lower distance = more similar.
 */
export function vectorSearch(
  db: Database.Database,
  queryEmbedding: number[],
  limit: number = 10
): VectorResult[] {
  const stmt = db.prepare(`
    SELECT id, distance
    FROM embeddings
    WHERE embedding MATCH ?
    ORDER BY distance
    LIMIT ?
  `);

  return stmt.all(JSON.stringify(queryEmbedding), limit) as VectorResult[];
}

// ─── Temporal decay (shared with search.ts) ─────────────────────────

const LAMBDA = Math.log(2) / 60; // half-life of 60 days

function applyDecay(
  score: number,
  shelfLife: string,
  dateExtracted: string | null,
  lastAccessed: string | null
): number {
  if (shelfLife === "evergreen") return score;

  const lambda = shelfLife === "time-sensitive" ? LAMBDA * 2 : LAMBDA;

  const refDateStr = lastAccessed ?? dateExtracted;
  if (!refDateStr) return score;

  const refDate = new Date(refDateStr);
  const now = new Date();
  const ageDays = (now.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays <= 0) return score;

  const decayFactor = Math.exp(-lambda * ageDays);
  return score * decayFactor;
}

// ─── hybridSearch ───────────────────────────────────────────────────

/**
 * Hybrid search combining FTS5 keyword search and vector semantic search.
 * Merges results using Reciprocal Rank Fusion (RRF).
 *
 * RRF formula: final_score = 1/(k + rank_vector) + 1/(k + rank_bm25)
 * k = 60 (standard RRF constant)
 *
 * If an insight appears in only one result set, the missing rank
 * defaults to (total_results + 1).
 */
export function hybridSearch(
  db: Database.Database,
  query: string,
  queryEmbedding: number[],
  options: HybridOptions = {}
): HybridResult[] {
  const { limit = 10, domain, tag } = options;
  const k = 60;

  // Fetch more candidates than needed for better RRF merging
  const fetchLimit = limit * 5;

  // 1. FTS5 keyword search
  const keywordResults = searchInsights(db, query, {
    limit: fetchLimit,
    domain,
    tag,
  });

  // 2. Vector search
  const vectorResults = vectorSearch(db, queryEmbedding, fetchLimit);

  // 3. Build rank maps (1-indexed ranks)
  const keywordRanks = new Map<string, number>();
  for (let i = 0; i < keywordResults.length; i++) {
    keywordRanks.set(keywordResults[i].id, i + 1);
  }

  const vectorRanks = new Map<string, number>();
  for (let i = 0; i < vectorResults.length; i++) {
    vectorRanks.set(vectorResults[i].id, i + 1);
  }

  // 4. Collect all unique IDs
  const allIds = new Set<string>([
    ...keywordRanks.keys(),
    ...vectorRanks.keys(),
  ]);

  const defaultKeywordRank = keywordResults.length + 1;
  const defaultVectorRank = vectorResults.length + 1;

  // 5. Compute RRF scores
  const rrfScores: Array<{
    id: string;
    score: number;
    matchType: "both" | "keyword" | "semantic";
  }> = [];

  for (const id of allIds) {
    const kRank = keywordRanks.get(id) ?? defaultKeywordRank;
    const vRank = vectorRanks.get(id) ?? defaultVectorRank;
    const score = 1 / (k + vRank) + 1 / (k + kRank);

    let matchType: "both" | "keyword" | "semantic";
    if (keywordRanks.has(id) && vectorRanks.has(id)) {
      matchType = "both";
    } else if (keywordRanks.has(id)) {
      matchType = "keyword";
    } else {
      matchType = "semantic";
    }

    rrfScores.push({ id, score, matchType });
  }

  // 6. Fetch full insight data for all candidates
  const insightStmt = db.prepare(`
    SELECT id, title, one_line, domain, topic, tags, confidence,
           file_path, shelf_life, date_extracted, last_accessed
    FROM insights
    WHERE id = ?
  `);

  interface InsightMeta {
    id: string;
    title: string;
    one_line: string;
    domain: string;
    topic: string;
    tags: string;
    confidence: string;
    file_path: string;
    shelf_life: string;
    date_extracted: string | null;
    last_accessed: string | null;
  }

  const results: HybridResult[] = [];

  for (const { id, score, matchType } of rrfScores) {
    const row = insightStmt.get(id) as InsightMeta | undefined;
    if (!row) continue;

    // Apply domain/tag filters for vector-only results
    // (FTS results are already filtered, but vector results are not)
    if (domain && row.domain !== domain) continue;
    if (tag && !` ${row.tags} `.includes(` ${tag} `)) continue;

    // Apply temporal decay to the RRF score
    const decayedScore = applyDecay(
      score,
      row.shelf_life,
      row.date_extracted,
      row.last_accessed
    );

    results.push({
      id: row.id,
      title: row.title,
      one_line: row.one_line,
      domain: row.domain,
      topic: row.topic,
      tags: row.tags,
      score: decayedScore,
      confidence: row.confidence,
      file_path: row.file_path,
      match_type: matchType,
    });
  }

  // 7. Sort by score descending (higher RRF = more relevant)
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, limit);
}
