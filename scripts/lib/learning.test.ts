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
  writeFlagsFile,
} from "./learning";
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

  it("writes flags in expected format", async () => {
    const flags = [
      {
        domain: "ai-development",
        topic: "claude-code",
        insightCount: 27,
        principleCount: 0,
      },
      {
        domain: "automation",
        topic: "n8n-workflows",
        insightCount: 9,
        principleCount: 0,
      },
    ];

    await writeFlagsFile(kbRoot, flags);

    const content = await readFile(join(kbRoot, "meta", "flags.md"), "utf-8");

    expect(content).toContain("# Learning Layer Flags");
    expect(content).toContain("## COMPRESS");
    expect(content).toContain("ai-development/claude-code: 27 insights, 0 principles (ratio: 27:0)");
    expect(content).toContain("automation/n8n-workflows: 9 insights, 0 principles (ratio: 9:0)");
  });

  it("writes 'No flags' when no flags are provided", async () => {
    await writeFlagsFile(kbRoot, []);

    const content = await readFile(join(kbRoot, "meta", "flags.md"), "utf-8");

    expect(content).toContain("No flags.");
    expect(content).not.toContain("## COMPRESS");
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
