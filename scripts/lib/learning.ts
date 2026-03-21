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

export interface ClusterFlag {
  insightIds: string[];
  topics: string[];
  sharedTags: string[];
}

export interface GapFlag {
  topicA: string;
  topicB: string;
  countA: number;
  countB: number;
  sharedTags: string[];
}

export interface TransferFlag {
  principleId: string;
  principleTitle: string;
  principleDomain: string;
  targetInsightId: string;
  targetDomain: string;
  targetTopic: string;
  similarity: number;
}

export interface LearningFlags {
  compress: EmergenceFlag[];
  discover: ClusterFlag[];
  gaps: GapFlag[];
  transfers: TransferFlag[];
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

// ─── Mechanism 4: Cluster Discovery ─────────────────────────────────

/**
 * Build a KNN graph of insight embeddings and run Louvain community
 * detection. Flag communities that span 2+ distinct topics.
 */
export async function discoverClusters(
  db: Database.Database,
  _kbRoot: string
): Promise<ClusterFlag[]> {
  // 1. Get all insight embeddings
  const rows = db
    .prepare("SELECT id, embedding FROM embeddings WHERE id LIKE 'INS-%'")
    .all() as Array<{ id: string; embedding: Buffer }>;

  if (rows.length < 2) return [];

  // 2. Dynamic import for ESM-only graphology modules
  const { default: Graph } = await import("graphology");
  const { default: louvain } = await import("graphology-communities-louvain");

  const graph = new Graph();

  // Add all insight nodes
  for (const row of rows) {
    graph.addNode(row.id);
  }

  // 3. For each insight, query top-10 neighbors; add edge if distance < 0.25
  const neighborStmt = db.prepare(`
    SELECT id, distance
    FROM embeddings
    WHERE embedding MATCH (SELECT embedding FROM embeddings WHERE id = ?)
    ORDER BY distance
    LIMIT 11
  `);

  for (const row of rows) {
    const neighbors = neighborStmt.all(row.id) as NeighborRow[];
    for (const n of neighbors) {
      if (n.id === row.id) continue;
      if (n.distance >= 0.25) continue;
      if (!graph.hasNode(n.id)) continue;
      if (!graph.hasEdge(row.id, n.id) && !graph.hasEdge(n.id, row.id)) {
        graph.addEdge(row.id, n.id, { weight: 1 - n.distance });
      }
    }
  }

  // If no edges, no communities to detect
  if (graph.size === 0) return [];

  // 4. Run Louvain community detection
  const communities = louvain(graph);

  // 5. Group insights by community
  const communityMap = new Map<number, string[]>();
  for (const [nodeId, community] of Object.entries(communities)) {
    const comm = community as number;
    if (!communityMap.has(comm)) communityMap.set(comm, []);
    communityMap.get(comm)!.push(nodeId);
  }

  // 6. For each community, check if it spans 2+ distinct topics
  const insightMetaStmt = db.prepare(
    "SELECT id, domain, topic, tags FROM insights WHERE id = ?"
  );

  const flags: ClusterFlag[] = [];

  for (const [, insightIds] of communityMap) {
    if (insightIds.length < 2) continue;

    const topicsSet = new Set<string>();
    const allTagSets: Set<string>[] = [];

    for (const id of insightIds) {
      const meta = insightMetaStmt.get(id) as
        | { id: string; domain: string; topic: string; tags: string }
        | undefined;
      if (!meta) continue;
      topicsSet.add(`${meta.domain}/${meta.topic}`);
      const tags = meta.tags.split(" ").filter(Boolean);
      allTagSets.push(new Set(tags));
    }

    // Only flag cross-topic clusters
    if (topicsSet.size < 2) continue;

    // Find shared tags across all insights in the cluster
    let sharedTags: string[] = [];
    if (allTagSets.length > 0) {
      const firstSet = allTagSets[0];
      sharedTags = [...firstSet].filter((tag) =>
        allTagSets.every((s) => s.has(tag))
      );
    }

    flags.push({
      insightIds,
      topics: [...topicsSet],
      sharedTags,
    });
  }

  return flags;
}

// ─── Mechanism 5: Gap Detection ─────────────────────────────────────

/**
 * Detect topics that are semantically similar but have very different
 * insight counts (ratio > 3:1). These are knowledge gaps.
 */
export async function detectGaps(
  db: Database.Database,
  _kbRoot: string
): Promise<GapFlag[]> {
  // 1. Get insight embeddings grouped by topic
  const rows = db
    .prepare(`
      SELECT i.id, i.topic, i.domain, i.tags, e.embedding
      FROM insights i
      JOIN embeddings e ON i.id = e.id
      WHERE i.id LIKE 'INS-%'
    `)
    .all() as Array<{
    id: string;
    topic: string;
    domain: string;
    tags: string;
    embedding: Buffer;
  }>;

  if (rows.length === 0) return [];

  // 2. Group by topic and compute centroids
  const topicGroups = new Map<
    string,
    { embeddings: number[][]; tags: Set<string>; count: number; domain: string }
  >();

  for (const row of rows) {
    const key = `${row.domain}/${row.topic}`;
    if (!topicGroups.has(key)) {
      topicGroups.set(key, {
        embeddings: [],
        tags: new Set(),
        count: 0,
        domain: row.domain,
      });
    }
    const group = topicGroups.get(key)!;

    // Parse embedding buffer into float array
    const buf = row.embedding;
    const floats = new Float32Array(
      buf.buffer,
      buf.byteOffset,
      buf.byteLength / 4
    );
    group.embeddings.push(Array.from(floats));

    for (const tag of row.tags.split(" ").filter(Boolean)) {
      group.tags.add(tag);
    }
    group.count++;
  }

  // Need at least 2 topics to compare
  if (topicGroups.size < 2) return [];

  // 3. Compute centroid for each topic and L2-normalize
  const centroids = new Map<string, { vec: number[]; count: number; tags: Set<string> }>();

  for (const [topic, group] of topicGroups) {
    const dim = group.embeddings[0].length;
    const centroid = new Array(dim).fill(0);

    for (const emb of group.embeddings) {
      for (let i = 0; i < dim; i++) {
        centroid[i] += emb[i];
      }
    }
    for (let i = 0; i < dim; i++) {
      centroid[i] /= group.count;
    }

    // L2-normalize
    let magnitude = 0;
    for (let i = 0; i < dim; i++) {
      magnitude += centroid[i] * centroid[i];
    }
    magnitude = Math.sqrt(magnitude);
    if (magnitude > 0) {
      for (let i = 0; i < dim; i++) {
        centroid[i] /= magnitude;
      }
    }

    centroids.set(topic, { vec: centroid, count: group.count, tags: group.tags });
  }

  // 4. For each pair of topics, compute cosine similarity and check for gaps
  const flags: GapFlag[] = [];
  const topicKeys = [...centroids.keys()];

  for (let a = 0; a < topicKeys.length; a++) {
    for (let b = a + 1; b < topicKeys.length; b++) {
      const keyA = topicKeys[a];
      const keyB = topicKeys[b];
      const dataA = centroids.get(keyA)!;
      const dataB = centroids.get(keyB)!;

      // Cosine similarity via dot product (vectors are already L2-normalized)
      let sim = 0;
      for (let i = 0; i < dataA.vec.length; i++) {
        sim += dataA.vec[i] * dataB.vec[i];
      }

      // Similar topics (sim > 0.70) with count ratio > 3:1
      if (sim > 0.70) {
        const ratio = Math.max(dataA.count, dataB.count) / Math.min(dataA.count, dataB.count);
        if (ratio > 3) {
          // Find shared tags
          const sharedTags = [...dataA.tags].filter((t) => dataB.tags.has(t));

          // Order so topicA is the larger one
          if (dataA.count >= dataB.count) {
            flags.push({
              topicA: keyA,
              topicB: keyB,
              countA: dataA.count,
              countB: dataB.count,
              sharedTags,
            });
          } else {
            flags.push({
              topicA: keyB,
              topicB: keyA,
              countA: dataB.count,
              countB: dataA.count,
              sharedTags,
            });
          }
        }
      }
    }
  }

  return flags;
}

// ─── Mechanism 6: Transfer Detection ────────────────────────────────

/**
 * Find principles that may apply to insights in OTHER domains,
 * filtered by the "surprise" heuristic (zero shared tags).
 */
export async function detectTransfers(
  db: Database.Database,
  kbRoot: string
): Promise<TransferFlag[]> {
  // 1. Get all principle embeddings
  const principleEmbRows = db
    .prepare("SELECT id, embedding FROM embeddings WHERE id LIKE 'PRI-%'")
    .all() as Array<{ id: string; embedding: Buffer }>;

  if (principleEmbRows.length === 0) return [];

  // 2. Get principle metadata from files
  const principleFiles = await fg("principles/**/*.md", {
    cwd: kbRoot,
    absolute: true,
    ignore: ["**/_index.md"],
  });

  const principleMetaMap = new Map<
    string,
    { title: string; domain: string; tags: Set<string> }
  >();

  for (const filePath of principleFiles) {
    try {
      const raw = await readFile(filePath, "utf-8");
      const { data } = matter(raw);
      if (data.id && data.domain && data.title) {
        principleMetaMap.set(data.id, {
          title: data.title,
          domain: data.domain,
          tags: new Set(Array.isArray(data.tags) ? data.tags : []),
        });
      }
    } catch {
      // Skip unreadable files
    }
  }

  // 3. For each principle, find nearest insights from other domains
  const flags: TransferFlag[] = [];

  for (const row of principleEmbRows) {
    const pMeta = principleMetaMap.get(row.id);
    if (!pMeta) continue;

    const buf = row.embedding;
    const floats = new Float32Array(
      buf.buffer,
      buf.byteOffset,
      buf.byteLength / 4
    );
    const embJson = JSON.stringify(Array.from(floats));

    // Query top-20 neighbors
    const neighbors = db
      .prepare(`
        SELECT id, distance
        FROM embeddings
        WHERE embedding MATCH ?
        ORDER BY distance
        LIMIT 20
      `)
      .all(embJson) as NeighborRow[];

    // Filter: other domains, distance < 0.25, take top 5
    let crossDomainCount = 0;

    for (const n of neighbors) {
      if (n.id === row.id) continue;
      if (n.distance >= 0.25) continue;
      if (!n.id.startsWith("INS-")) continue;

      // Get insight metadata
      const insightMeta = db
        .prepare("SELECT id, domain, topic, tags FROM insights WHERE id = ?")
        .get(n.id) as
        | { id: string; domain: string; topic: string; tags: string }
        | undefined;
      if (!insightMeta) continue;

      // Must be from a different domain
      if (insightMeta.domain === pMeta.domain) continue;

      // Surprise filter: zero tag overlap
      const insightTags = new Set(insightMeta.tags.split(" ").filter(Boolean));
      const hasOverlap = [...pMeta.tags].some((t) => insightTags.has(t));
      if (hasOverlap) continue;

      flags.push({
        principleId: row.id,
        principleTitle: pMeta.title,
        principleDomain: pMeta.domain,
        targetInsightId: insightMeta.id,
        targetDomain: insightMeta.domain,
        targetTopic: insightMeta.topic,
        similarity: 1 - n.distance,
      });

      crossDomainCount++;
      if (crossDomainCount >= 5) break;
    }
  }

  return flags;
}

// ─── Flags file writer ──────────────────────────────────────────────

/**
 * Write all learning flags to the meta/flags.md file.
 */
export async function writeFlagsFile(
  kbRoot: string,
  flags: LearningFlags
): Promise<void> {
  const now = new Date().toISOString().slice(0, 10);
  const lines: string[] = [];

  lines.push("# Learning Layer Flags");
  lines.push(`Generated by learn.ts on ${now}`);
  lines.push("");

  // COMPRESS section
  lines.push("## COMPRESS");
  if (flags.compress.length === 0) {
    lines.push("None.");
  } else {
    for (const flag of flags.compress) {
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

  // DISCOVER section
  lines.push("## DISCOVER");
  if (flags.discover.length === 0) {
    lines.push("None.");
  } else {
    for (const flag of flags.discover) {
      const tagsStr =
        flag.sharedTags.length > 0 ? flag.sharedTags.join(", ") : "none";
      lines.push(
        `- ${flag.insightIds.length} insights form cluster across ${flag.topics.join(", ")} — shared tags: ${tagsStr}`
      );
    }
  }
  lines.push("");

  // GAP section
  lines.push("## GAP");
  if (flags.gaps.length === 0) {
    lines.push("None.");
  } else {
    for (const flag of flags.gaps) {
      lines.push(
        `- ${flag.topicA} has ${flag.countA} insights but related ${flag.topicB} has only ${flag.countB}`
      );
    }
  }
  lines.push("");

  // TRANSFER section
  lines.push("## TRANSFER");
  if (flags.transfers.length === 0) {
    lines.push("None.");
  } else {
    for (const flag of flags.transfers) {
      lines.push(
        `- "${flag.principleTitle}" (${flag.principleDomain}) may apply to ${flag.targetDomain}/${flag.targetTopic} (sim: ${flag.similarity.toFixed(2)})`
      );
    }
  }
  lines.push("");

  const flagsPath = join(kbRoot, "meta", "flags.md");
  await writeFile(flagsPath, lines.join("\n"), "utf-8");
}
