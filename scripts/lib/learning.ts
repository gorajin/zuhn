import type Database from "better-sqlite3";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import fg from "fast-glob";
import matter from "gray-matter";

// ─── Types ──────────────────────────────────────────────────────────

export interface ConnectionResult {
  totalUpdated: number;
  connections: Array<{ id: string; related: string[] }>;
}

export interface EmergenceFlag {
  domain: string;
  topic: string;
  insightCount: number;
  principleCount: number;
}

export interface ConfidenceChange {
  id: string;
  oldConfidence: string;
  newConfidence: string;
  reason: string;
}

interface NeighborRow {
  id: string;
  distance: number;
}

// ─── Confidence levels (ordered) ────────────────────────────────────

const CONFIDENCE_LEVELS = ["pending", "low", "medium", "high", "very_high"];

function confidenceRank(level: string): number {
  const idx = CONFIDENCE_LEVELS.indexOf(level);
  return idx === -1 ? 0 : idx;
}

// ─── Mechanism 1: Automatic Connection Discovery ────────────────────

/**
 * For each insight with an embedding, find the top-5 most similar
 * insights by cosine similarity. Update the `related` field in
 * each insight's YAML frontmatter. Connections are bidirectional.
 */
export async function discoverConnections(
  db: Database.Database,
  kbRoot: string
): Promise<ConnectionResult> {
  // 1. Get all embedded insight IDs
  const embeddedRows = db
    .prepare("SELECT id FROM embeddings")
    .all() as { id: string }[];

  if (embeddedRows.length === 0) {
    return { totalUpdated: 0, connections: [] };
  }

  // 2. For each insight, query the vec0 table for 6 nearest neighbors
  //    (top 6 because the first result is the insight itself)
  const neighborStmt = db.prepare(`
    SELECT id, distance
    FROM embeddings
    WHERE embedding MATCH (SELECT embedding FROM embeddings WHERE id = ?)
    ORDER BY distance
    LIMIT 6
  `);

  // Build a map: insightId -> top-5 related IDs (excluding self)
  const rawConnections = new Map<string, string[]>();

  for (const row of embeddedRows) {
    const neighbors = neighborStmt.all(row.id) as NeighborRow[];
    // Skip self-match (position 0, distance ~0)
    const related = neighbors
      .filter((n) => n.id !== row.id)
      .slice(0, 5)
      .map((n) => n.id);
    rawConnections.set(row.id, related);
  }

  // 3. Make bidirectional: if A relates to B, B also relates to A
  const bidirectional = new Map<string, Set<string>>();

  for (const [id, related] of rawConnections) {
    if (!bidirectional.has(id)) bidirectional.set(id, new Set());
    for (const relId of related) {
      bidirectional.get(id)!.add(relId);
      if (!bidirectional.has(relId)) bidirectional.set(relId, new Set());
      bidirectional.get(relId)!.add(id);
    }
  }

  // 4. Get file paths for all insights that need updating
  const insightStmt = db.prepare(
    "SELECT id, file_path FROM insights WHERE id = ?"
  );

  let totalUpdated = 0;
  const connections: Array<{ id: string; related: string[] }> = [];

  for (const [id, relatedSet] of bidirectional) {
    // Cap at 10 related IDs
    const relatedArray = [...relatedSet].slice(0, 10);

    const insightRow = insightStmt.get(id) as
      | { id: string; file_path: string }
      | undefined;
    if (!insightRow) continue;

    // Resolve file path (may be relative to kbRoot or absolute)
    const filePath = insightRow.file_path.startsWith("/")
      ? insightRow.file_path
      : join(kbRoot, insightRow.file_path);

    try {
      const updated = await updateFrontmatterRelated(filePath, relatedArray);
      if (updated) {
        totalUpdated++;
        connections.push({ id, related: relatedArray });
        console.log(`Connected ${id} → [${relatedArray.join(", ")}]`);
      }
    } catch (err) {
      // File might not exist or be unreadable — skip
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`Warning: could not update ${id}: ${msg}`);
    }
  }

  return { totalUpdated, connections };
}

/**
 * Read an insight file, update the `related` array in frontmatter,
 * and write it back. Returns true if the file was changed.
 */
async function updateFrontmatterRelated(
  filePath: string,
  relatedIds: string[]
): Promise<boolean> {
  const raw = await readFile(filePath, "utf-8");
  const { data, content } = matter(raw);

  const existing = Array.isArray(data.related) ? data.related : [];
  const sorted = [...relatedIds].sort();
  const existingSorted = [...existing].sort();

  // Skip if no change
  if (
    sorted.length === existingSorted.length &&
    sorted.every((v, i) => v === existingSorted[i])
  ) {
    return false;
  }

  data.related = relatedIds;
  const output = matter.stringify(content, data);
  await writeFile(filePath, output, "utf-8");
  return true;
}

// ─── Mechanism 2: Principle Emergence Detection ─────────────────────

/**
 * Checks each topic's insight:principle ratio. If insights >= 5
 * and principles == 0 (or ratio > 5:1), flags for compression.
 */
export async function detectEmergence(
  kbRoot: string
): Promise<EmergenceFlag[]> {
  // 1. Count insights per domain/topic by scanning domains/
  const insightFiles = await fg("domains/**/*.md", {
    cwd: kbRoot,
    absolute: true,
    ignore: ["**/_overview.md", "**/_summary.md"],
  });

  const topicCounts = new Map<string, number>();

  for (const filePath of insightFiles) {
    try {
      const raw = await readFile(filePath, "utf-8");
      const { data } = matter(raw);
      if (data.domain && data.topic) {
        const key = `${data.domain}/${data.topic}`;
        topicCounts.set(key, (topicCounts.get(key) ?? 0) + 1);
      }
    } catch {
      // Skip unreadable files
    }
  }

  // 2. Count principles per domain by scanning principles/
  const principleFiles = await fg("principles/**/*.md", {
    cwd: kbRoot,
    absolute: true,
    ignore: ["**/_index.md"],
  });

  const principleCounts = new Map<string, number>();

  for (const filePath of principleFiles) {
    try {
      const raw = await readFile(filePath, "utf-8");
      const { data } = matter(raw);
      if (data.domain) {
        // Count principles by domain (principles span an entire domain)
        principleCounts.set(
          data.domain,
          (principleCounts.get(data.domain) ?? 0) + 1
        );
      }
    } catch {
      // Skip unreadable files
    }
  }

  // 3. Flag topics where insights >= 5 and principles == 0 (or ratio > 5:1)
  const flags: EmergenceFlag[] = [];

  for (const [key, insightCount] of topicCounts) {
    const [domain, topic] = key.split("/");
    const principleCount = principleCounts.get(domain) ?? 0;

    if (insightCount >= 5 && (principleCount === 0 || insightCount / principleCount > 5)) {
      flags.push({ domain, topic, insightCount, principleCount });
    }
  }

  // Sort by insight count descending for consistent output
  flags.sort((a, b) => b.insightCount - a.insightCount);

  return flags;
}

// ─── Mechanism 3: Confidence Propagation ────────────────────────────

/**
 * When two insights from DIFFERENT sources have >0.85 cosine similarity,
 * they corroborate each other and confidence increases.
 *
 * Cosine distance in vec0 = 1 - cosine_similarity
 * So similarity > 0.85 means distance < 0.15
 */
export async function propagateConfidence(
  db: Database.Database,
  kbRoot: string
): Promise<ConfidenceChange[]> {
  const SIMILARITY_THRESHOLD = 0.85; // cosine similarity
  const DISTANCE_THRESHOLD = 1 - SIMILARITY_THRESHOLD; // 0.15

  // 1. Get all embedded insights with their metadata
  const insightRows = db
    .prepare(`
      SELECT i.id, i.confidence, i.file_path, i.domain, i.topic
      FROM insights i
      WHERE EXISTS (SELECT 1 FROM embeddings e WHERE e.id = i.id)
    `)
    .all() as Array<{
    id: string;
    confidence: string;
    file_path: string;
    domain: string;
    topic: string;
  }>;

  if (insightRows.length === 0) return [];

  // Build a map for quick lookup
  const insightMap = new Map(insightRows.map((r) => [r.id, r]));

  // 2. Load source info from frontmatter for each insight
  const sourceMap = new Map<string, { type: string; title: string }>();

  for (const row of insightRows) {
    const filePath = row.file_path.startsWith("/")
      ? row.file_path
      : join(kbRoot, row.file_path);

    try {
      const raw = await readFile(filePath, "utf-8");
      const { data } = matter(raw);
      if (data.sources && Array.isArray(data.sources) && data.sources.length > 0) {
        sourceMap.set(row.id, {
          type: data.sources[0].type ?? "unknown",
          title: data.sources[0].title ?? "unknown",
        });
      }
    } catch {
      // Skip unreadable files
    }
  }

  // 3. For each insight, find high-similarity neighbors from different sources
  const neighborStmt = db.prepare(`
    SELECT id, distance
    FROM embeddings
    WHERE embedding MATCH (SELECT embedding FROM embeddings WHERE id = ?)
    ORDER BY distance
    LIMIT 6
  `);

  // Track corroborations per insight
  const corroborations = new Map<
    string,
    Array<{ fromId: string; sourceType: string; sourceTitle: string }>
  >();

  for (const row of insightRows) {
    const neighbors = neighborStmt.all(row.id) as NeighborRow[];
    const mySource = sourceMap.get(row.id);
    if (!mySource) continue;

    for (const neighbor of neighbors) {
      if (neighbor.id === row.id) continue; // skip self
      if (neighbor.distance > DISTANCE_THRESHOLD) continue; // not similar enough

      const neighborSource = sourceMap.get(neighbor.id);
      if (!neighborSource) continue;

      // Check if different source (different title)
      if (neighborSource.title === mySource.title) continue;

      // Echo chamber dampening: same platform + same community = 0.5x
      // We model this by requiring distinct source types for higher confidence
      if (!corroborations.has(row.id)) corroborations.set(row.id, []);
      corroborations.get(row.id)!.push({
        fromId: neighbor.id,
        sourceType: neighborSource.type,
        sourceTitle: neighborSource.title,
      });
    }
  }

  // 4. Apply confidence transition rules
  const changes: ConfidenceChange[] = [];

  for (const [id, corbs] of corroborations) {
    const insight = insightMap.get(id);
    if (!insight) continue;

    const oldConfidence = insight.confidence;

    // Count distinct source types (with echo chamber dampening)
    const sourceTypes = new Set(corbs.map((c) => c.sourceType));
    const sourceTitles = new Set(corbs.map((c) => c.sourceTitle));

    // Calculate effective corroboration weight
    // Same type sources count as 0.5x weight each
    let effectiveWeight = 0;
    for (const corb of corbs) {
      // Check if this is an "echo chamber" corroboration
      // (same source type as the insight being evaluated)
      const mySource = sourceMap.get(id);
      if (mySource && corb.sourceType === mySource.type) {
        effectiveWeight += 0.5;
      } else {
        effectiveWeight += 1.0;
      }
    }

    // Determine new confidence level
    let newConfidence: string;
    if (effectiveWeight >= 3 && sourceTypes.size >= 3) {
      newConfidence = "very_high";
    } else if (effectiveWeight >= 2 && sourceTypes.size >= 2) {
      newConfidence = "high";
    } else if (effectiveWeight >= 1) {
      newConfidence = "medium";
    } else {
      newConfidence = "low";
    }

    // Only INCREASE confidence, never decrease
    if (confidenceRank(newConfidence) <= confidenceRank(oldConfidence)) {
      continue;
    }

    // Update the frontmatter
    const filePath = insight.file_path.startsWith("/")
      ? insight.file_path
      : join(kbRoot, insight.file_path);

    try {
      await updateFrontmatterConfidence(filePath, newConfidence);

      // Also update the DB
      db.prepare("UPDATE insights SET confidence = ? WHERE id = ?").run(
        newConfidence,
        id
      );

      const reason = `corroborated by ${corbs.map((c) => c.fromId).join(", ")} from ${sourceTitles.size} distinct source(s)`;
      changes.push({ id, oldConfidence, newConfidence, reason });
      console.log(
        `${id} confidence: ${oldConfidence} → ${newConfidence} (${reason})`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`Warning: could not update confidence for ${id}: ${msg}`);
    }
  }

  return changes;
}

/**
 * Update the confidence field in an insight file's frontmatter.
 */
async function updateFrontmatterConfidence(
  filePath: string,
  newConfidence: string
): Promise<void> {
  const raw = await readFile(filePath, "utf-8");
  const { data, content } = matter(raw);

  data.confidence = newConfidence;
  const output = matter.stringify(content, data);
  await writeFile(filePath, output, "utf-8");
}

// ─── Flags file writer ──────────────────────────────────────────────

/**
 * Write emergence flags to the meta/flags.md file.
 */
export async function writeFlagsFile(
  kbRoot: string,
  flags: EmergenceFlag[]
): Promise<void> {
  const now = new Date().toISOString().slice(0, 10);
  const lines: string[] = [];

  lines.push("# Learning Layer Flags");
  lines.push(`Generated by learn.ts on ${now}`);
  lines.push("");

  if (flags.length === 0) {
    lines.push("No flags.");
  } else {
    lines.push("## COMPRESS");
    for (const flag of flags) {
      const ratio =
        flag.principleCount === 0
          ? `${flag.insightCount}:0`
          : `${flag.insightCount}:${flag.principleCount}`;
      lines.push(
        `- ${flag.domain}/${flag.topic}: ${flag.insightCount} insights, ${flag.principleCount} principles (ratio: ${ratio})`
      );
    }
  }

  lines.push("");

  const flagsPath = join(kbRoot, "meta", "flags.md");
  await writeFile(flagsPath, lines.join("\n"), "utf-8");
}
