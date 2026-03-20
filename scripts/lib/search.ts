import type Database from "better-sqlite3";

// ─── Types ──────────────────────────────────────────────────────────

export interface SearchOptions {
  limit?: number;
  domain?: string;
  tag?: string;
  minConfidence?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  one_line: string;
  domain: string;
  topic: string;
  tags: string;
  score: number;
  confidence: string;
  file_path: string;
}

// ─── Confidence ordering (for minConfidence filter) ─────────────────

const CONFIDENCE_RANK: Record<string, number> = {
  pending: 0,
  low: 1,
  medium: 2,
  high: 3,
  very_high: 4,
};

// ─── Temporal decay ─────────────────────────────────────────────────

const LAMBDA = Math.log(2) / 60; // half-life of 60 days

/**
 * Apply temporal decay to a BM25 score.
 * In SQLite FTS5, BM25 scores are negative (more negative = more relevant).
 * We multiply the absolute relevance by the decay factor.
 */
function applyDecay(
  score: number,
  shelfLife: string,
  dateExtracted: string | null,
  lastAccessed: string | null
): number {
  // Evergreen insights skip decay
  if (shelfLife === "evergreen") return score;

  // Determine the reference date: prefer last_accessed if recent, else date_extracted
  const refDateStr = lastAccessed ?? dateExtracted;
  if (!refDateStr) return score;

  const refDate = new Date(refDateStr);
  const now = new Date();
  const ageDays = (now.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24);

  if (ageDays <= 0) return score;

  // score is negative; multiply its magnitude by decay, keep it negative
  const decayFactor = Math.exp(-LAMBDA * ageDays);
  return score * decayFactor;
}

// ─── searchInsights ─────────────────────────────────────────────────

/**
 * Full-text search across insights using FTS5 with BM25 ranking.
 *
 * Returns results sorted by relevance (most relevant first).
 * BM25 in SQLite FTS5 returns negative scores where more negative = more relevant.
 */
export function searchInsights(
  db: Database.Database,
  query: string,
  options: SearchOptions = {}
): SearchResult[] {
  const { limit = 10, domain, tag, minConfidence } = options;

  if (!query.trim()) return [];

  // Sanitize the query for FTS5: escape double quotes
  const sanitized = query.replace(/"/g, '""');

  // Build the SQL query joining FTS results with the insights table
  let sql = `
    SELECT
      i.id,
      i.title,
      i.one_line,
      i.domain,
      i.topic,
      i.tags,
      i.confidence,
      i.file_path,
      i.shelf_life,
      i.date_extracted,
      i.last_accessed,
      bm25(insights_fts) AS score
    FROM insights_fts fts
    JOIN insights i ON fts.id = i.id
    WHERE insights_fts MATCH @query
  `;

  const params: Record<string, string | number> = { query: sanitized };

  if (domain) {
    sql += ` AND i.domain = @domain`;
    params.domain = domain;
  }

  if (tag) {
    sql += ` AND (' ' || i.tags || ' ') LIKE @tagPattern`;
    params.tagPattern = `% ${tag} %`;
  }

  sql += ` ORDER BY score LIMIT @limit`;
  params.limit = limit * 2; // fetch extra to account for post-filters

  const stmt = db.prepare(sql);
  const rows = stmt.all(params) as Array<
    SearchResult & {
      shelf_life: string;
      date_extracted: string | null;
      last_accessed: string | null;
    }
  >;

  // Apply confidence filter and temporal decay in TypeScript
  let results: SearchResult[] = [];

  const minRank = minConfidence ? (CONFIDENCE_RANK[minConfidence] ?? 0) : 0;

  for (const row of rows) {
    // Filter by minimum confidence
    if (minConfidence) {
      const rowRank = CONFIDENCE_RANK[row.confidence] ?? 0;
      if (rowRank < minRank) continue;
    }

    // Apply temporal decay
    const decayedScore = applyDecay(
      row.score,
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
    });
  }

  // Re-sort by decayed score (more negative = more relevant)
  results.sort((a, b) => a.score - b.score);

  // Apply final limit
  return results.slice(0, limit);
}
