import { describe, it, expect, beforeEach } from "vitest";
import type Database from "better-sqlite3";
import { initDb, upsertInsight } from "./db";
import {
  initVectorTable,
  upsertEmbedding,
  vectorSearch,
  hybridSearch,
} from "./vector-search";
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
    title: "Use hooks to force-activate skills",
    actionability: "immediate",
    confidence: "high",
    shelf_life: "evergreen",
    status: "active",
    tags: ["hooks", "skills"],
    sources: [{ type: "reddit", title: "Claude Code is a Beast" }],
    date_extracted: "2026-03-20",
    last_accessed: null,
    access_count: 0,
    indexed: true,
    embedded: false,
    resolutions: {
      one_line:
        "Force-activate skills via hooks to ensure consistent behavior",
      standard: "Claude ignores skills unless hooks enforce activation.",
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
  // Put high values at a few positions based on seed
  vec[seed % dim] = 1.0;
  vec[(seed * 7 + 3) % dim] = 0.8;
  vec[(seed * 13 + 11) % dim] = 0.6;
  return vec;
}

// ─── initVectorTable tests ──────────────────────────────────────────

describe("initVectorTable", () => {
  it("creates the embeddings virtual table without error", () => {
    const db = createTestDb();

    // Verify the embeddings table exists
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='embeddings'"
      )
      .all();
    expect(tables).toHaveLength(1);

    db.close();
  });

  it("is idempotent — calling twice does not error", () => {
    const db = initDb(":memory:");
    expect(() => {
      initVectorTable(db);
      initVectorTable(db);
    }).not.toThrow();

    db.close();
  });
});

// ─── upsertEmbedding + vectorSearch tests ───────────────────────────

describe("upsertEmbedding + vectorSearch", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDb();
  });

  it("inserts and finds a single embedding", () => {
    const emb = syntheticEmbedding(1);
    upsertEmbedding(db, "INS-001", emb);

    const results = vectorSearch(db, emb, 5);
    expect(results.length).toBe(1);
    expect(results[0].id).toBe("INS-001");
    expect(results[0].distance).toBeCloseTo(0, 4);

    db.close();
  });

  it("returns nearest neighbors ordered by distance", () => {
    // Insert three embeddings: emb1, emb2 (similar to emb1), emb3 (different)
    const emb1 = syntheticEmbedding(1);
    const emb2 = syntheticEmbedding(1); // identical
    const emb3 = syntheticEmbedding(100); // different

    // Make emb2 slightly different
    emb2[0] += 0.1;

    upsertEmbedding(db, "INS-001", emb1);
    upsertEmbedding(db, "INS-002", emb2);
    upsertEmbedding(db, "INS-003", emb3);

    // Query with emb1 — INS-001 should be closest, INS-002 next, INS-003 last
    const results = vectorSearch(db, emb1, 5);
    expect(results.length).toBe(3);
    expect(results[0].id).toBe("INS-001");
    expect(results[0].distance).toBeCloseTo(0, 4);

    // INS-002 should be closer than INS-003
    const dist002 = results.find((r) => r.id === "INS-002")!.distance;
    const dist003 = results.find((r) => r.id === "INS-003")!.distance;
    expect(dist002).toBeLessThan(dist003);

    db.close();
  });

  it("respects the limit parameter", () => {
    for (let i = 0; i < 20; i++) {
      upsertEmbedding(db, `INS-${i.toString().padStart(3, "0")}`, syntheticEmbedding(i));
    }

    const results = vectorSearch(db, syntheticEmbedding(0), 5);
    expect(results.length).toBe(5);

    db.close();
  });

  it("upsertEmbedding replaces existing embedding", () => {
    const emb1 = syntheticEmbedding(1);
    const emb2 = syntheticEmbedding(100);

    upsertEmbedding(db, "INS-001", emb1);
    upsertEmbedding(db, "INS-001", emb2); // replace

    // Querying with emb2 should find INS-001 at distance ~0
    const results = vectorSearch(db, emb2, 5);
    expect(results.length).toBe(1);
    expect(results[0].id).toBe("INS-001");
    expect(results[0].distance).toBeCloseTo(0, 4);

    // Querying with emb1 should find INS-001 at a non-zero distance
    const results2 = vectorSearch(db, emb1, 5);
    expect(results2[0].distance).toBeGreaterThan(0.01);

    db.close();
  });
});

// ─── hybridSearch tests ─────────────────────────────────────────────

describe("hybridSearch", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDb();

    // Insert insights into the insights table (for FTS5)
    const insights = [
      {
        id: "INS-260320-0001",
        domain: "ai-development",
        topic: "claude-code",
        title: "Use hooks to force-activate skills",
        tags: ["hooks", "skills"],
        resolutions: {
          one_line: "Force-activate skills via hooks to ensure consistent behavior",
          standard: "Claude ignores skills unless hooks enforce activation.",
        },
      },
      {
        id: "INS-260320-0002",
        domain: "ai-development",
        topic: "llm-costs",
        title: "Test cheaper models before defaulting to expensive",
        tags: ["llm-costs", "model-selection", "cost-reduction"],
        confidence: "high",
        resolutions: {
          one_line: "Don't default to expensive models — test cheaper ones with YOUR data",
          standard: "Benchmark cheaper models against your specific use case.",
        },
      },
      {
        id: "INS-260320-0003",
        domain: "pets",
        topic: "dog-care",
        title: "Let dogs sniff freely on walks",
        tags: ["dogs", "walks", "enrichment"],
        confidence: "high",
        resolutions: {
          one_line: "Allow dogs to sniff freely during walks for mental stimulation",
          standard: "Scent exploration provides more mental stimulation than physical exercise.",
        },
      },
      {
        id: "INS-260320-0004",
        domain: "ai-development",
        topic: "prompt-engineering",
        title: "Use structured output for reliable JSON",
        tags: ["prompts", "json", "structured-output"],
        confidence: "high",
        resolutions: {
          one_line: "Use structured output mode for reliable JSON parsing from LLMs",
          standard: "Structured output ensures the model returns valid JSON every time.",
        },
      },
    ];

    for (const ins of insights) {
      upsertInsight(db, makeInsight(ins), `/path/${ins.id}.md`);
    }

    // Insert synthetic embeddings into the vec table
    // Make the embeddings encode some semantic meaning:
    // - INS-0001 and INS-0004 share "AI/development" semantics (similar embeddings)
    // - INS-0002 has "cost" semantics
    // - INS-0003 has "pets" semantics (very different)
    upsertEmbedding(db, "INS-260320-0001", syntheticEmbedding(10)); // AI/hooks
    upsertEmbedding(db, "INS-260320-0002", syntheticEmbedding(20)); // AI/costs
    upsertEmbedding(db, "INS-260320-0003", syntheticEmbedding(300)); // pets
    upsertEmbedding(db, "INS-260320-0004", syntheticEmbedding(11)); // AI/prompts (close to 10)
  });

  it("returns results with match_type field", () => {
    // Query that matches keyword "hooks" and vector near seed=10
    const queryEmb = syntheticEmbedding(10);
    const results = hybridSearch(db, "hooks", queryEmb, { limit: 10 });

    expect(results.length).toBeGreaterThan(0);

    for (const r of results) {
      expect(["both", "keyword", "semantic"]).toContain(r.match_type);
    }

    db.close();
  });

  it("marks results found in both keyword and vector as 'both'", () => {
    // "hooks" matches INS-0001 by keyword
    // syntheticEmbedding(10) matches INS-0001 by vector (distance 0)
    const queryEmb = syntheticEmbedding(10);
    const results = hybridSearch(db, "hooks", queryEmb, { limit: 10 });

    const ins0001 = results.find((r) => r.id === "INS-260320-0001");
    expect(ins0001).toBeDefined();
    expect(ins0001!.match_type).toBe("both");

    db.close();
  });

  it("includes semantic-only results not found by keyword", () => {
    // Search for "hooks" by keyword — only INS-0001 matches
    // But vector search with syntheticEmbedding(11) also finds INS-0004 (close embedding)
    const queryEmb = syntheticEmbedding(11);
    const results = hybridSearch(db, "hooks", queryEmb, { limit: 10 });

    // INS-0004 should appear as semantic-only or both
    const ins0004 = results.find((r) => r.id === "INS-260320-0004");
    expect(ins0004).toBeDefined();

    db.close();
  });

  it("filters by domain", () => {
    const queryEmb = syntheticEmbedding(10);
    const results = hybridSearch(db, "hooks OR dogs", queryEmb, {
      limit: 10,
      domain: "ai-development",
    });

    for (const r of results) {
      expect(r.domain).toBe("ai-development");
    }

    // Should not contain pets
    expect(results.some((r) => r.id === "INS-260320-0003")).toBe(false);

    db.close();
  });

  it("returns scores in descending order", () => {
    const queryEmb = syntheticEmbedding(10);
    const results = hybridSearch(db, "hooks", queryEmb, { limit: 10 });

    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }

    db.close();
  });

  it("returns all required fields", () => {
    const queryEmb = syntheticEmbedding(10);
    const results = hybridSearch(db, "hooks", queryEmb, { limit: 10 });

    expect(results.length).toBeGreaterThan(0);
    const r = results[0];
    expect(r).toHaveProperty("id");
    expect(r).toHaveProperty("title");
    expect(r).toHaveProperty("one_line");
    expect(r).toHaveProperty("domain");
    expect(r).toHaveProperty("topic");
    expect(r).toHaveProperty("tags");
    expect(r).toHaveProperty("score");
    expect(r).toHaveProperty("confidence");
    expect(r).toHaveProperty("file_path");
    expect(r).toHaveProperty("match_type");

    db.close();
  });
});
