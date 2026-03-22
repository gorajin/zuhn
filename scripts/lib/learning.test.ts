import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync } from "node:fs";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type Database from "better-sqlite3";
import matter from "gray-matter";
import { initDb, upsertInsight } from "./db";
import { initVectorTable, upsertEmbedding } from "./vector-search";
import {
  discoverConnections,
  detectEmergence,
  propagateConfidence,
  discoverClusters,
  detectGaps,
  detectTransfers,
  writeFlagsFile,
} from "./learning";
import type { LearningFlags } from "./learning";
import type { InsightData } from "../schemas/frontmatter";

// ─── Test helpers ───────────────────────────────────────────────────

function createTestDb(): Database.Database {
  const db = initDb(":memory:");
  initVectorTable(db);
  return db;
}

function makeInsight(overrides: Partial<InsightData> = {}): InsightData {
  return {
    id: "INS-260320-0001",
    domain: "ai-development",
    topic: "claude-code",
    title: "Test insight",
    actionability: "immediate",
    confidence: "low",
    shelf_life: "evergreen",
    status: "active",
    tags: ["test"],
    sources: [{ type: "reddit", title: "Source A" }],
    date_extracted: "2026-03-20",
    last_accessed: null,
    access_count: 0,
    indexed: true,
    embedded: true,
    resolutions: {
      one_line: "Test one line",
      standard: "Test standard resolution.",
    },
    ...overrides,
  } as InsightData;
}

/**
 * Generate a synthetic embedding (deterministic based on seed).
 * Creates a unit-ish vector with a dominant component at position (seed % dim).
 */
function syntheticEmbedding(seed: number, dim: number = 768): number[] {
  const vec = new Array(dim).fill(0.01);
  vec[seed % dim] = 1.0;
  vec[(seed * 7 + 3) % dim] = 0.8;
  vec[(seed * 13 + 11) % dim] = 0.6;
  return vec;
}

/**
 * Create a very similar embedding by adding slight noise.
 * The resulting vector will have high cosine similarity (>0.85) to the base.
 */
function similarEmbedding(base: number[], noise: number = 0.02): number[] {
  return base.map((v, i) => v + (i % 2 === 0 ? noise : -noise));
}

let tmpDir: string;

async function createTmpKb(): Promise<string> {
  tmpDir = join(tmpdir(), `gyeol-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  await mkdir(join(tmpDir, "domains", "ai-development", "claude-code"), {
    recursive: true,
  });
  await mkdir(join(tmpDir, "domains", "ai-development", "llm-costs"), {
    recursive: true,
  });
  await mkdir(join(tmpDir, "principles"), { recursive: true });
  await mkdir(join(tmpDir, "meta"), { recursive: true });
  return tmpDir;
}

async function writeInsightFile(
  kbRoot: string,
  insight: InsightData,
  body: string = ""
): Promise<string> {
  const dir = join(
    kbRoot,
    "domains",
    insight.domain,
    insight.topic
  );
  await mkdir(dir, { recursive: true });
  const slug = insight.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const filePath = join(dir, `${slug}.md`);

  const content = body || insight.resolutions.standard;
  const frontmatter: Record<string, unknown> = { ...insight };
  const output = matter.stringify(content, frontmatter);
  await writeFile(filePath, output, "utf-8");
  return filePath;
}

// ─── Mechanism 1: discoverConnections ───────────────────────────────

describe("discoverConnections", () => {
  let db: Database.Database;
  let kbRoot: string;

  beforeEach(async () => {
    db = createTestDb();
    kbRoot = await createTmpKb();
  });

  afterEach(async () => {
    db.close();
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true });
  });

  it("returns connections for insights that have embeddings", async () => {
    // Create 3 insights with embeddings
    for (let i = 1; i <= 3; i++) {
      const id = `INS-260320-000${i}`;
      const insight = makeInsight({
        id,
        title: `Insight ${i}`,
        resolutions: {
          one_line: `One line ${i}`,
          standard: `Standard ${i}`,
        },
      });
      const filePath = await writeInsightFile(kbRoot, insight);
      upsertInsight(db, insight, filePath);
      upsertEmbedding(db, id, syntheticEmbedding(i));
    }

    const result = await discoverConnections(db, kbRoot);

    expect(result.totalUpdated).toBeGreaterThan(0);
    expect(result.connections.length).toBeGreaterThan(0);

    // Every connection should have at least 1 related insight
    for (const conn of result.connections) {
      expect(conn.related.length).toBeGreaterThan(0);
    }
  });

  it("connections are bidirectional", async () => {
    const insightA = makeInsight({
      id: "INS-260320-AAAA",
      title: "Insight A",
      resolutions: { one_line: "A line", standard: "A standard" },
    });
    const insightB = makeInsight({
      id: "INS-260320-BBBB",
      title: "Insight B",
      resolutions: { one_line: "B line", standard: "B standard" },
    });

    const pathA = await writeInsightFile(kbRoot, insightA);
    const pathB = await writeInsightFile(kbRoot, insightB);

    upsertInsight(db, insightA, pathA);
    upsertInsight(db, insightB, pathB);

    // Use similar embeddings so they are each other's neighbors
    const baseEmb = syntheticEmbedding(42);
    upsertEmbedding(db, "INS-260320-AAAA", baseEmb);
    upsertEmbedding(db, "INS-260320-BBBB", similarEmbedding(baseEmb, 0.05));

    const result = await discoverConnections(db, kbRoot);

    // Both should appear in connections
    const connA = result.connections.find((c) => c.id === "INS-260320-AAAA");
    const connB = result.connections.find((c) => c.id === "INS-260320-BBBB");

    expect(connA).toBeDefined();
    expect(connB).toBeDefined();

    // A should relate to B and B should relate to A
    expect(connA!.related).toContain("INS-260320-BBBB");
    expect(connB!.related).toContain("INS-260320-AAAA");
  });

  it("self-references are excluded", async () => {
    const insight = makeInsight({
      id: "INS-260320-SELF",
      title: "Self insight",
      resolutions: { one_line: "Self line", standard: "Self standard" },
    });

    const filePath = await writeInsightFile(kbRoot, insight);
    upsertInsight(db, insight, filePath);
    upsertEmbedding(db, "INS-260320-SELF", syntheticEmbedding(99));

    const result = await discoverConnections(db, kbRoot);

    // The insight should not be related to itself
    for (const conn of result.connections) {
      expect(conn.related).not.toContain(conn.id);
    }
  });

  it("related array is capped at 10", async () => {
    // Create 15 insights all very similar to each other
    const baseEmb = syntheticEmbedding(1);
    for (let i = 1; i <= 15; i++) {
      const id = `INS-260320-${String(i).padStart(4, "0")}`;
      const insight = makeInsight({
        id,
        title: `Insight ${i}`,
        resolutions: {
          one_line: `One line ${i}`,
          standard: `Standard ${i}`,
        },
      });
      const filePath = await writeInsightFile(kbRoot, insight);
      upsertInsight(db, insight, filePath);
      // Small noise to make them close but distinct
      upsertEmbedding(db, id, similarEmbedding(baseEmb, 0.001 * i));
    }

    const result = await discoverConnections(db, kbRoot);

    // No insight should have more than 10 related entries
    for (const conn of result.connections) {
      expect(conn.related.length).toBeLessThanOrEqual(10);
    }
  });

  it("returns empty when no embeddings exist", async () => {
    const result = await discoverConnections(db, kbRoot);
    expect(result.totalUpdated).toBe(0);
    expect(result.connections).toHaveLength(0);
  });
});

// ─── Mechanism 2: detectEmergence ───────────────────────────────────

describe("detectEmergence", () => {
  let kbRoot: string;

  beforeEach(async () => {
    kbRoot = await createTmpKb();
  });

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true });
  });

  it("flags topics with >= 5 insights and 0 principles", async () => {
    // Create 6 insight files in claude-code topic
    for (let i = 1; i <= 6; i++) {
      const insight = makeInsight({
        id: `INS-260320-CC${String(i).padStart(2, "0")}`,
        domain: "ai-development",
        topic: "claude-code",
        title: `Claude code insight ${i}`,
        resolutions: {
          one_line: `Claude code one line ${i}`,
          standard: `Claude code standard ${i}`,
        },
      });
      await writeInsightFile(kbRoot, insight);
    }

    const flags = await detectEmergence(kbRoot);

    expect(flags.length).toBeGreaterThan(0);
    const ccFlag = flags.find(
      (f) => f.domain === "ai-development" && f.topic === "claude-code"
    );
    expect(ccFlag).toBeDefined();
    expect(ccFlag!.insightCount).toBe(6);
    expect(ccFlag!.principleCount).toBe(0);
  });

  it("does not flag topics with < 5 insights", async () => {
    // Create only 3 insight files in llm-costs topic
    for (let i = 1; i <= 3; i++) {
      const insight = makeInsight({
        id: `INS-260320-LC${String(i).padStart(2, "0")}`,
        domain: "ai-development",
        topic: "llm-costs",
        title: `LLM costs insight ${i}`,
        resolutions: {
          one_line: `LLM costs one line ${i}`,
          standard: `LLM costs standard ${i}`,
        },
      });
      await writeInsightFile(kbRoot, insight);
    }

    const flags = await detectEmergence(kbRoot);

    const lcFlag = flags.find(
      (f) => f.domain === "ai-development" && f.topic === "llm-costs"
    );
    expect(lcFlag).toBeUndefined();
  });

  it("returns empty when no insight files exist", async () => {
    const flags = await detectEmergence(kbRoot);
    expect(flags).toHaveLength(0);
  });
});

// ─── writeFlagsFile ─────────────────────────────────────────────────

describe("writeFlagsFile", () => {
  let kbRoot: string;

  beforeEach(async () => {
    kbRoot = await createTmpKb();
  });

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true });
  });

  it("writes all four sections in expected format", async () => {
    const flags: LearningFlags = {
      compress: [
        {
          domain: "ai-development",
          topic: "claude-code",
          insightCount: 27,
          principleCount: 0,
        },
      ],
      discover: [
        {
          insightIds: ["INS-260320-0001", "INS-260320-0002"],
          topics: ["ai-development/claude-code", "automation/n8n-workflows"],
          sharedTags: ["productivity"],
        },
      ],
      gaps: [
        {
          topicA: "ai-development/claude-code",
          topicB: "ai-development/llm-costs",
          countA: 12,
          countB: 3,
          sharedTags: ["ai"],
        },
      ],
      transfers: [
        {
          principleId: "PRI-260320-0001",
          principleTitle: "Plan before coding",
          principleDomain: "ai-development",
          targetInsightId: "INS-260320-0099",
          targetDomain: "startups",
          targetTopic: "mvp-strategy",
          similarity: 0.82,
        },
      ],
    };

    await writeFlagsFile(kbRoot, flags);

    const content = await readFile(join(kbRoot, "meta", "flags.md"), "utf-8");

    expect(content).toContain("# Learning Layer Flags");
    // COMPRESS
    expect(content).toContain("## COMPRESS");
    expect(content).toContain("ai-development/claude-code: 27 insights, 0 principles (ratio: 27:0)");
    // DISCOVER
    expect(content).toContain("## DISCOVER");
    expect(content).toContain("2 insights form cluster across");
    expect(content).toContain("shared tags: productivity");
    // GAP
    expect(content).toContain("## GAP");
    expect(content).toContain("ai-development/claude-code has 12 insights but related ai-development/llm-costs has only 3");
    // TRANSFER
    expect(content).toContain("## TRANSFER");
    expect(content).toContain('"Plan before coding" (ai-development) may apply to startups/mvp-strategy (sim: 0.82)');
  });

  it("writes 'None.' for empty sections", async () => {
    const flags: LearningFlags = {
      compress: [],
      discover: [],
      gaps: [],
      transfers: [],
    };

    await writeFlagsFile(kbRoot, flags);

    const content = await readFile(join(kbRoot, "meta", "flags.md"), "utf-8");

    expect(content).toContain("## COMPRESS");
    expect(content).toContain("## DISCOVER");
    expect(content).toContain("## GAP");
    expect(content).toContain("## TRANSFER");
    // Each section should show "None."
    const noneCount = (content.match(/None\./g) || []).length;
    expect(noneCount).toBe(4);
  });
});

// ─── Mechanism 3: propagateConfidence ───────────────────────────────

describe("propagateConfidence", () => {
  let db: Database.Database;
  let kbRoot: string;

  beforeEach(async () => {
    db = createTestDb();
    kbRoot = await createTmpKb();
  });

  afterEach(async () => {
    db.close();
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true });
  });

  it("bumps confidence for high-similarity cross-source matches", async () => {
    // Create two insights from DIFFERENT sources with very similar embeddings
    const insightA = makeInsight({
      id: "INS-260320-AAAA",
      title: "Insight from source A",
      confidence: "low",
      sources: [{ type: "reddit", title: "Reddit Post A" }],
      resolutions: {
        one_line: "Planning is critical for Claude Code",
        standard: "Standard A",
      },
    });
    const insightB = makeInsight({
      id: "INS-260320-BBBB",
      title: "Insight from source B",
      confidence: "low",
      sources: [{ type: "youtube", title: "YouTube Video B" }],
      resolutions: {
        one_line: "Planning is essential for Claude Code usage",
        standard: "Standard B",
      },
    });

    const pathA = await writeInsightFile(kbRoot, insightA);
    const pathB = await writeInsightFile(kbRoot, insightB);

    upsertInsight(db, insightA, pathA);
    upsertInsight(db, insightB, pathB);

    // Use nearly identical embeddings (cosine sim > 0.85)
    const baseEmb = syntheticEmbedding(42);
    upsertEmbedding(db, "INS-260320-AAAA", baseEmb);
    upsertEmbedding(db, "INS-260320-BBBB", similarEmbedding(baseEmb, 0.005));

    const changes = await propagateConfidence(db, kbRoot);

    expect(changes.length).toBeGreaterThan(0);

    // At least one should have increased confidence
    const changed = changes.find(
      (c) => c.id === "INS-260320-AAAA" || c.id === "INS-260320-BBBB"
    );
    expect(changed).toBeDefined();
    expect(
      ["medium", "high", "very_high"].includes(changed!.newConfidence)
    ).toBe(true);
  });

  it("does not increase confidence for same-source matches", async () => {
    // Create two insights from the SAME source with similar embeddings
    const insightA = makeInsight({
      id: "INS-260320-AAAA",
      title: "Insight one from same source",
      confidence: "low",
      sources: [{ type: "reddit", title: "Same Source Post" }],
      resolutions: {
        one_line: "First insight from same source",
        standard: "Standard A",
      },
    });
    const insightB = makeInsight({
      id: "INS-260320-BBBB",
      title: "Insight two from same source",
      confidence: "low",
      sources: [{ type: "reddit", title: "Same Source Post" }],
      resolutions: {
        one_line: "Second insight from same source",
        standard: "Standard B",
      },
    });

    const pathA = await writeInsightFile(kbRoot, insightA);
    const pathB = await writeInsightFile(kbRoot, insightB);

    upsertInsight(db, insightA, pathA);
    upsertInsight(db, insightB, pathB);

    const baseEmb = syntheticEmbedding(42);
    upsertEmbedding(db, "INS-260320-AAAA", baseEmb);
    upsertEmbedding(db, "INS-260320-BBBB", similarEmbedding(baseEmb, 0.005));

    const changes = await propagateConfidence(db, kbRoot);

    // No changes because both come from the same source
    expect(changes).toHaveLength(0);
  });

  it("confidence transitions follow defined rules", async () => {
    // Create insight at "pending" confidence with cross-source corroboration
    const insightA = makeInsight({
      id: "INS-260320-AAAA",
      title: "Pending insight",
      confidence: "pending",
      sources: [{ type: "reddit", title: "Reddit Post" }],
      resolutions: {
        one_line: "Pending confidence insight text",
        standard: "Standard A",
      },
    });
    const insightB = makeInsight({
      id: "INS-260320-BBBB",
      title: "Corroborating insight",
      confidence: "high",
      sources: [{ type: "blog", title: "Blog Post" }],
      resolutions: {
        one_line: "Corroborating confidence insight text",
        standard: "Standard B",
      },
    });

    const pathA = await writeInsightFile(kbRoot, insightA);
    const pathB = await writeInsightFile(kbRoot, insightB);

    upsertInsight(db, insightA, pathA);
    upsertInsight(db, insightB, pathB);

    const baseEmb = syntheticEmbedding(42);
    upsertEmbedding(db, "INS-260320-AAAA", baseEmb);
    upsertEmbedding(db, "INS-260320-BBBB", similarEmbedding(baseEmb, 0.005));

    const changes = await propagateConfidence(db, kbRoot);

    // The pending insight should have been bumped up
    const changeA = changes.find((c) => c.id === "INS-260320-AAAA");
    expect(changeA).toBeDefined();
    expect(changeA!.oldConfidence).toBe("pending");
    // With 1 corroboration from a different source type, should go to medium
    expect(changeA!.newConfidence).toBe("medium");
  });

  it("never decreases confidence", async () => {
    // Create insight at "very_high" confidence — should not change
    const insightA = makeInsight({
      id: "INS-260320-AAAA",
      title: "Very high insight",
      confidence: "very_high",
      sources: [{ type: "reddit", title: "Reddit Post" }],
      resolutions: {
        one_line: "Very high confidence",
        standard: "Standard A",
      },
    });
    const insightB = makeInsight({
      id: "INS-260320-BBBB",
      title: "Another insight",
      confidence: "low",
      sources: [{ type: "blog", title: "Blog Post" }],
      resolutions: {
        one_line: "Another insight text",
        standard: "Standard B",
      },
    });

    const pathA = await writeInsightFile(kbRoot, insightA);
    const pathB = await writeInsightFile(kbRoot, insightB);

    upsertInsight(db, insightA, pathA);
    upsertInsight(db, insightB, pathB);

    const baseEmb = syntheticEmbedding(42);
    upsertEmbedding(db, "INS-260320-AAAA", baseEmb);
    upsertEmbedding(db, "INS-260320-BBBB", similarEmbedding(baseEmb, 0.005));

    const changes = await propagateConfidence(db, kbRoot);

    // Insight A should NOT have changed (already very_high)
    const changeA = changes.find((c) => c.id === "INS-260320-AAAA");
    expect(changeA).toBeUndefined();
  });

  it("returns empty when no embeddings exist", async () => {
    const changes = await propagateConfidence(db, kbRoot);
    expect(changes).toHaveLength(0);
  });
});

// ─── Mechanism 4: discoverClusters ──────────────────────────────────

describe("discoverClusters", () => {
  let db: Database.Database;
  let kbRoot: string;

  beforeEach(async () => {
    db = createTestDb();
    kbRoot = await createTmpKb();
  });

  afterEach(async () => {
    db.close();
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true });
  });

  it("detects cross-topic clusters of similar insights", async () => {
    // Use two very different base embeddings to create two clear clusters.
    // Each cluster contains insights from BOTH topics, forcing Louvain to
    // produce a cross-topic community.
    const baseA = syntheticEmbedding(42);
    const baseB = syntheticEmbedding(500); // far from baseA

    // Cluster 1: one insight from each topic, all near baseA
    const cluster1Insights = [
      { id: "INS-260320-C1A1", domain: "ai-development", topic: "claude-code", title: "C1 claude 1", tags: ["ai", "tooling"] },
      { id: "INS-260320-C1A2", domain: "ai-development", topic: "claude-code", title: "C1 claude 2", tags: ["ai", "tooling"] },
      { id: "INS-260320-C1B1", domain: "ai-development", topic: "llm-costs", title: "C1 llm 1", tags: ["ai", "costs"] },
    ];
    for (let i = 0; i < cluster1Insights.length; i++) {
      const meta = cluster1Insights[i];
      const insight = makeInsight({
        id: meta.id,
        domain: meta.domain,
        topic: meta.topic,
        title: meta.title,
        tags: meta.tags,
        resolutions: { one_line: `${meta.title} line`, standard: `${meta.title} std` },
      });
      const filePath = await writeInsightFile(kbRoot, insight);
      upsertInsight(db, insight, filePath);
      upsertEmbedding(db, meta.id, similarEmbedding(baseA, 0.001 * (i + 1)));
    }

    // Cluster 2: insights near baseB (far away, won't merge with cluster 1)
    const cluster2Insights = [
      { id: "INS-260320-C2A1", domain: "ai-development", topic: "claude-code", title: "C2 claude 1", tags: ["ai"] },
      { id: "INS-260320-C2B1", domain: "ai-development", topic: "llm-costs", title: "C2 llm 1", tags: ["costs"] },
    ];
    for (let i = 0; i < cluster2Insights.length; i++) {
      const meta = cluster2Insights[i];
      const insight = makeInsight({
        id: meta.id,
        domain: meta.domain,
        topic: meta.topic,
        title: meta.title,
        tags: meta.tags,
        resolutions: { one_line: `${meta.title} line`, standard: `${meta.title} std` },
      });
      const filePath = await writeInsightFile(kbRoot, insight);
      upsertInsight(db, insight, filePath);
      upsertEmbedding(db, meta.id, similarEmbedding(baseB, 0.001 * (i + 1)));
    }

    const clusters = await discoverClusters(db, kbRoot);

    // At least one cluster should span 2+ topics
    expect(clusters.length).toBeGreaterThan(0);

    const crossTopic = clusters.find((c) => c.topics.length >= 2);
    expect(crossTopic).toBeDefined();
    expect(crossTopic!.insightIds.length).toBeGreaterThanOrEqual(2);
  });

  it("does not flag single-topic clusters", async () => {
    // Create insights in the SAME topic with similar embeddings
    const baseEmb = syntheticEmbedding(42);

    for (let i = 1; i <= 4; i++) {
      const id = `INS-260320-SS0${i}`;
      const insight = makeInsight({
        id,
        domain: "ai-development",
        topic: "claude-code",
        title: `Same topic insight ${i}`,
        tags: ["ai"],
        resolutions: { one_line: `Same line ${i}`, standard: `Same std ${i}` },
      });
      const filePath = await writeInsightFile(kbRoot, insight);
      upsertInsight(db, insight, filePath);
      upsertEmbedding(db, id, similarEmbedding(baseEmb, 0.001 * i));
    }

    // Add a distant insight in another topic so it won't cluster
    const distant = makeInsight({
      id: "INS-260320-DD01",
      domain: "ai-development",
      topic: "llm-costs",
      title: "Distant insight",
      tags: ["costs"],
      resolutions: { one_line: "Distant line", standard: "Distant std" },
    });
    const distantPath = await writeInsightFile(kbRoot, distant);
    upsertInsight(db, distant, distantPath);
    upsertEmbedding(db, "INS-260320-DD01", syntheticEmbedding(500));

    const clusters = await discoverClusters(db, kbRoot);

    // Any flagged cluster must span 2+ topics
    for (const cluster of clusters) {
      expect(cluster.topics.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("returns empty when fewer than 2 embeddings", async () => {
    const insight = makeInsight({
      id: "INS-260320-ONLY",
      title: "Only insight",
      resolutions: { one_line: "Only line", standard: "Only std" },
    });
    const filePath = await writeInsightFile(kbRoot, insight);
    upsertInsight(db, insight, filePath);
    upsertEmbedding(db, "INS-260320-ONLY", syntheticEmbedding(1));

    const clusters = await discoverClusters(db, kbRoot);
    expect(clusters).toHaveLength(0);
  });
});

// ─── Mechanism 5: detectGaps ────────────────────────────────────────

describe("detectGaps", () => {
  let db: Database.Database;
  let kbRoot: string;

  beforeEach(async () => {
    db = createTestDb();
    kbRoot = await createTmpKb();
  });

  afterEach(async () => {
    db.close();
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true });
  });

  it("detects gap when topics are similar but have >3:1 count ratio", async () => {
    const baseEmb = syntheticEmbedding(42);

    // Topic A: 8 insights (large topic)
    for (let i = 1; i <= 8; i++) {
      const id = `INS-260320-GA${String(i).padStart(2, "0")}`;
      const insight = makeInsight({
        id,
        domain: "ai-development",
        topic: "claude-code",
        title: `Gap A insight ${i}`,
        tags: ["ai", "tooling", "automation"],
        resolutions: { one_line: `Gap A line ${i}`, standard: `Gap A std ${i}` },
      });
      const filePath = await writeInsightFile(kbRoot, insight);
      upsertInsight(db, insight, filePath);
      upsertEmbedding(db, id, similarEmbedding(baseEmb, 0.0005 * i));
    }

    // Topic B: 2 insights (small topic) with similar centroid
    for (let i = 1; i <= 2; i++) {
      const id = `INS-260320-GB${String(i).padStart(2, "0")}`;
      const insight = makeInsight({
        id,
        domain: "ai-development",
        topic: "llm-costs",
        title: `Gap B insight ${i}`,
        tags: ["ai", "automation"],
        resolutions: { one_line: `Gap B line ${i}`, standard: `Gap B std ${i}` },
      });
      const filePath = await writeInsightFile(kbRoot, insight);
      upsertInsight(db, insight, filePath);
      upsertEmbedding(db, id, similarEmbedding(baseEmb, 0.003 * i));
    }

    const gaps = await detectGaps(db, kbRoot);

    expect(gaps.length).toBeGreaterThan(0);
    const gap = gaps[0];
    // Larger topic should be topicA
    expect(gap.countA).toBeGreaterThan(gap.countB);
    expect(gap.countA / gap.countB).toBeGreaterThan(3);
  });

  it("does not flag when count ratio is <= 3:1", async () => {
    const baseEmb = syntheticEmbedding(42);

    // Both topics have similar counts (3 and 3)
    for (let i = 1; i <= 3; i++) {
      const idA = `INS-260320-EA${String(i).padStart(2, "0")}`;
      const insightA = makeInsight({
        id: idA,
        domain: "ai-development",
        topic: "claude-code",
        title: `Equal A insight ${i}`,
        tags: ["ai"],
        resolutions: { one_line: `Equal A line ${i}`, standard: `Equal A std ${i}` },
      });
      const pathA = await writeInsightFile(kbRoot, insightA);
      upsertInsight(db, insightA, pathA);
      upsertEmbedding(db, idA, similarEmbedding(baseEmb, 0.001 * i));

      const idB = `INS-260320-EB${String(i).padStart(2, "0")}`;
      const insightB = makeInsight({
        id: idB,
        domain: "ai-development",
        topic: "llm-costs",
        title: `Equal B insight ${i}`,
        tags: ["ai"],
        resolutions: { one_line: `Equal B line ${i}`, standard: `Equal B std ${i}` },
      });
      const pathB = await writeInsightFile(kbRoot, insightB);
      upsertInsight(db, insightB, pathB);
      upsertEmbedding(db, idB, similarEmbedding(baseEmb, 0.002 * i));
    }

    const gaps = await detectGaps(db, kbRoot);
    expect(gaps).toHaveLength(0);
  });

  it("returns empty when no embeddings exist", async () => {
    const gaps = await detectGaps(db, kbRoot);
    expect(gaps).toHaveLength(0);
  });
});

// ─── Mechanism 6: detectTransfers ───────────────────────────────────

describe("detectTransfers", () => {
  let db: Database.Database;
  let kbRoot: string;

  beforeEach(async () => {
    db = createTestDb();
    kbRoot = await createTmpKb();
  });

  afterEach(async () => {
    db.close();
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true });
  });

  it("detects cross-domain transfer with zero tag overlap", async () => {
    const baseEmb = syntheticEmbedding(42);

    // Create a principle in domain A
    const principleDir = join(kbRoot, "principles", "ai-development");
    await mkdir(principleDir, { recursive: true });
    const principleContent = matter.stringify("Principle body.", {
      id: "PRI-260320-0001",
      domain: "ai-development",
      title: "Plan before coding",
      summary: "Always plan",
      confidence: "high",
      supporting_insights: ["INS-260320-AA01"],
      supporting_count: 1,
      tags: ["planning", "strategy"],
      date_created: "2026-03-20",
      last_reviewed: "2026-03-20",
      resolutions: { one_line: "Plan first", standard: "Plan before code." },
    });
    await writeFile(join(principleDir, "plan-before-coding.md"), principleContent, "utf-8");
    upsertEmbedding(db, "PRI-260320-0001", baseEmb);

    // Create insight in a DIFFERENT domain with similar embedding + NO shared tags
    const insight = makeInsight({
      id: "INS-260320-XD01",
      domain: "startups",
      topic: "mvp-strategy",
      title: "MVP requires planning",
      tags: ["mvp", "lean"],  // no overlap with principle tags
      resolutions: { one_line: "MVP line", standard: "MVP std" },
    });
    const filePath = await writeInsightFile(kbRoot, insight);
    upsertInsight(db, insight, filePath);
    upsertEmbedding(db, "INS-260320-XD01", similarEmbedding(baseEmb, 0.005));

    const transfers = await detectTransfers(db, kbRoot);

    expect(transfers.length).toBeGreaterThan(0);
    const transfer = transfers.find((t) => t.principleId === "PRI-260320-0001");
    expect(transfer).toBeDefined();
    expect(transfer!.targetDomain).toBe("startups");
    expect(transfer!.targetTopic).toBe("mvp-strategy");
    expect(transfer!.similarity).toBeGreaterThan(0.75);
  });

  it("excludes same-domain matches", async () => {
    const baseEmb = syntheticEmbedding(42);

    // Principle in ai-development
    const principleDir = join(kbRoot, "principles", "ai-development");
    await mkdir(principleDir, { recursive: true });
    const principleContent = matter.stringify("Principle body.", {
      id: "PRI-260320-0001",
      domain: "ai-development",
      title: "Same domain principle",
      summary: "Summary",
      confidence: "high",
      supporting_insights: [],
      supporting_count: 0,
      tags: ["planning"],
      date_created: "2026-03-20",
      last_reviewed: "2026-03-20",
      resolutions: { one_line: "One line", standard: "Standard" },
    });
    await writeFile(join(principleDir, "same-domain.md"), principleContent, "utf-8");
    upsertEmbedding(db, "PRI-260320-0001", baseEmb);

    // Insight in the SAME domain
    const insight = makeInsight({
      id: "INS-260320-SD01",
      domain: "ai-development",
      topic: "claude-code",
      title: "Same domain insight",
      tags: ["different-tag"],
      resolutions: { one_line: "SD line", standard: "SD std" },
    });
    const filePath = await writeInsightFile(kbRoot, insight);
    upsertInsight(db, insight, filePath);
    upsertEmbedding(db, "INS-260320-SD01", similarEmbedding(baseEmb, 0.005));

    const transfers = await detectTransfers(db, kbRoot);

    // Should not flag same-domain transfer
    const sameDomain = transfers.find(
      (t) => t.principleId === "PRI-260320-0001" && t.targetDomain === "ai-development"
    );
    expect(sameDomain).toBeUndefined();
  });

  it("excludes matches with shared tags (surprise filter)", async () => {
    const baseEmb = syntheticEmbedding(42);

    // Principle with tags ["planning", "strategy"]
    const principleDir = join(kbRoot, "principles", "ai-development");
    await mkdir(principleDir, { recursive: true });
    const principleContent = matter.stringify("Principle body.", {
      id: "PRI-260320-0001",
      domain: "ai-development",
      title: "Shared tag principle",
      summary: "Summary",
      confidence: "high",
      supporting_insights: [],
      supporting_count: 0,
      tags: ["planning", "strategy"],
      date_created: "2026-03-20",
      last_reviewed: "2026-03-20",
      resolutions: { one_line: "One line", standard: "Standard" },
    });
    await writeFile(join(principleDir, "shared-tag.md"), principleContent, "utf-8");
    upsertEmbedding(db, "PRI-260320-0001", baseEmb);

    // Insight in different domain but with OVERLAPPING tags
    const insight = makeInsight({
      id: "INS-260320-OT01",
      domain: "startups",
      topic: "growth",
      title: "Overlapping tags insight",
      tags: ["planning", "growth"],  // "planning" overlaps
      resolutions: { one_line: "OT line", standard: "OT std" },
    });
    const filePath = await writeInsightFile(kbRoot, insight);
    upsertInsight(db, insight, filePath);
    upsertEmbedding(db, "INS-260320-OT01", similarEmbedding(baseEmb, 0.005));

    const transfers = await detectTransfers(db, kbRoot);

    // Surprise filter should exclude this match
    const overlapping = transfers.find(
      (t) => t.targetInsightId === "INS-260320-OT01"
    );
    expect(overlapping).toBeUndefined();
  });

  it("returns empty when no principle embeddings exist", async () => {
    const transfers = await detectTransfers(db, kbRoot);
    expect(transfers).toHaveLength(0);
  });
});

// ─── Integration tests (real DB) ────────────────────────────────────

const BRAIN_DB_PATH = join(
  __dirname,
  "../../knowledge-base/db/brain.db"
);
const REAL_KB_ROOT = join(__dirname, "../../knowledge-base");

describe.skipIf(!existsSync(BRAIN_DB_PATH))(
  "Integration tests (real brain.db)",
  () => {
    it("discoverConnections finds connections for real insights", async () => {
      const db = initDb(BRAIN_DB_PATH);
      initVectorTable(db);

      try {
        // Don't write to real files — just verify the connection logic works
        const embeddedRows = db
          .prepare("SELECT id FROM embeddings")
          .all() as { id: string }[];

        expect(embeddedRows.length).toBeGreaterThan(0);

        // Test that neighbor query works
        const stmt = db.prepare(`
          SELECT id, distance
          FROM embeddings
          WHERE embedding MATCH (SELECT embedding FROM embeddings WHERE id = ?)
          ORDER BY distance
          LIMIT 6
        `);

        const firstId = embeddedRows[0].id;
        const neighbors = stmt.all(firstId) as Array<{
          id: string;
          distance: number;
        }>;

        expect(neighbors.length).toBeGreaterThan(0);
        // First result should be self with distance ~0
        expect(neighbors[0].id).toBe(firstId);
        expect(neighbors[0].distance).toBeCloseTo(0, 2);
      } finally {
        db.close();
      }
    });

    it("detectEmergence returns flags (may be empty if principles exist)", async () => {
      const flags = await detectEmergence(REAL_KB_ROOT);

      // After compression passes, flags may be empty (all topics have principles)
      // or may contain newly grown topics. Either way, the function should return an array.
      expect(Array.isArray(flags)).toBe(true);

      // Any flagged topic should have >= 5 insights
      for (const flag of flags) {
        expect(flag.insightCount).toBeGreaterThanOrEqual(5);
      }
    });
  }
);

// ─── Mechanism 8 tests moved to empirical.test.ts for isolation ─────
// (Tests were contaminated by shared module state in the same file)
