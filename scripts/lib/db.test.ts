import { describe, it, expect, beforeEach } from "vitest";
import type Database from "better-sqlite3";
import { initDb, upsertInsight, getInsightById, getAllInsights } from "./db";
import { searchInsights } from "./search";
import type { InsightData } from "../schemas/frontmatter";

// ─── Test helpers ───────────────────────────────────────────────────

function createTestDb(): Database.Database {
  return initDb(":memory:");
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

// ─── initDb tests ───────────────────────────────────────────────────

describe("initDb", () => {
  it("creates tables without error", () => {
    const db = createTestDb();
    expect(db).toBeDefined();

    // Verify the insights table exists
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='insights'"
      )
      .all();
    expect(tables).toHaveLength(1);

    db.close();
  });

  it("creates FTS virtual table", () => {
    const db = createTestDb();

    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='insights_fts'"
      )
      .all();
    expect(tables).toHaveLength(1);

    db.close();
  });

  it("is idempotent — calling twice does not error", () => {
    const db = createTestDb();
    // Run the schema again on the same db — should not throw
    expect(() => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS insights (
          id TEXT PRIMARY KEY,
          domain TEXT NOT NULL,
          topic TEXT NOT NULL,
          subtopic TEXT,
          title TEXT NOT NULL,
          one_line TEXT NOT NULL,
          confidence TEXT DEFAULT 'pending',
          status TEXT DEFAULT 'active',
          shelf_life TEXT DEFAULT 'evergreen',
          actionability TEXT DEFAULT 'reference',
          tags TEXT NOT NULL,
          file_path TEXT NOT NULL,
          content_hash TEXT NOT NULL,
          date_extracted TEXT,
          last_accessed TEXT,
          access_count INTEGER DEFAULT 0
        );
      `);
    }).not.toThrow();

    db.close();
  });
});

// ─── upsertInsight / getInsightById tests ───────────────────────────

describe("upsertInsight", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDb();
  });

  it("inserts and can be retrieved by getInsightById", () => {
    const insight = makeInsight();
    upsertInsight(db, insight, "/path/to/insight.md");

    const row = getInsightById(db, "INS-260320-0001");
    expect(row).toBeDefined();
    expect(row!.id).toBe("INS-260320-0001");
    expect(row!.domain).toBe("ai-development");
    expect(row!.topic).toBe("claude-code");
    expect(row!.title).toBe("Use hooks to force-activate skills");
    expect(row!.one_line).toBe(
      "Force-activate skills via hooks to ensure consistent behavior"
    );
    expect(row!.tags).toBe("hooks skills");
    expect(row!.file_path).toBe("/path/to/insight.md");
    expect(row!.confidence).toBe("high");
    expect(row!.content_hash).toBeTruthy();

    db.close();
  });

  it("upserts — same ID updates the row", () => {
    const insight = makeInsight();
    upsertInsight(db, insight, "/path/to/insight.md");

    // Update with new title
    const updated = makeInsight({ title: "Updated title for hooks" });
    upsertInsight(db, updated, "/path/to/insight.md");

    const row = getInsightById(db, "INS-260320-0001");
    expect(row!.title).toBe("Updated title for hooks");

    // Should still be only one row
    const all = getAllInsights(db);
    expect(all).toHaveLength(1);

    db.close();
  });

  it("stores subtopic as null when not provided", () => {
    const insight = makeInsight();
    upsertInsight(db, insight, "/path/to/insight.md");

    const row = getInsightById(db, "INS-260320-0001");
    expect(row!.subtopic).toBeNull();

    db.close();
  });

  it("stores subtopic when provided", () => {
    const insight = makeInsight({ subtopic: "skills-system" });
    upsertInsight(db, insight, "/path/to/insight.md");

    const row = getInsightById(db, "INS-260320-0001");
    expect(row!.subtopic).toBe("skills-system");

    db.close();
  });
});

// ─── getAllInsights tests ───────────────────────────────────────────

describe("getAllInsights", () => {
  it("returns all inserted insights", () => {
    const db = createTestDb();

    upsertInsight(db, makeInsight({ id: "INS-260320-0001" }), "/path/a.md");
    upsertInsight(
      db,
      makeInsight({
        id: "INS-260320-0002",
        title: "Second insight",
        resolutions: {
          one_line: "Second one line",
          standard: "Second standard",
        },
      }),
      "/path/b.md"
    );

    const all = getAllInsights(db);
    expect(all).toHaveLength(2);

    db.close();
  });
});

// ─── FTS5 search tests ─────────────────────────────────────────────

describe("searchInsights", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDb();

    // Insert a variety of insights for search testing
    upsertInsight(
      db,
      makeInsight({
        id: "INS-260320-0001",
        domain: "ai-development",
        topic: "claude-code",
        title: "Use hooks to force-activate skills",
        tags: ["hooks", "skills"],
        resolutions: {
          one_line:
            "Force-activate skills via hooks to ensure consistent behavior",
          standard: "Claude ignores skills unless hooks enforce activation.",
        },
      }),
      "/path/hooks.md"
    );

    upsertInsight(
      db,
      makeInsight({
        id: "INS-260320-0002",
        domain: "ai-development",
        topic: "llm-costs",
        title: "Test cheaper models before defaulting to expensive",
        tags: ["llm-costs", "model-selection", "cost-reduction"],
        confidence: "high",
        resolutions: {
          one_line:
            "Don't default to expensive models — test cheaper ones with YOUR data",
          standard: "Benchmark cheaper models against your specific use case.",
        },
      }),
      "/path/costs.md"
    );

    upsertInsight(
      db,
      makeInsight({
        id: "INS-260320-0003",
        domain: "pets",
        topic: "dog-care",
        title: "Let dogs sniff freely on walks",
        tags: ["dogs", "walks", "enrichment"],
        confidence: "high",
        resolutions: {
          one_line:
            "Allow dogs to sniff freely during walks for mental stimulation",
          standard:
            "Scent exploration provides more mental stimulation than physical exercise.",
        },
      }),
      "/path/dogs.md"
    );

    upsertInsight(
      db,
      makeInsight({
        id: "INS-260320-0004",
        domain: "music-production",
        topic: "synthesis",
        title: "DFAM has no MIDI — sampling is primary integration",
        tags: ["dfam", "moog", "sampling"],
        confidence: "high",
        resolutions: {
          one_line:
            "The Moog DFAM has no MIDI — sampling its output is the primary integration method",
          standard:
            "The DFAM has no MIDI capability, so sampling is the way to integrate.",
        },
      }),
      "/path/dfam.md"
    );

    upsertInsight(
      db,
      makeInsight({
        id: "INS-260320-0005",
        domain: "ai-development",
        topic: "llm-costs",
        title: "Use cheap models for categorization before expensive ones",
        tags: ["llm-costs", "categorization", "cost-reduction"],
        confidence: "medium",
        shelf_life: "time-sensitive",
        resolutions: {
          one_line:
            "Use cheap models for pre-filtering, expensive for quality output",
          standard:
            "Use cheap models to categorize, only pass relevant items to expensive models.",
        },
      }),
      "/path/cheap-models.md"
    );
  });

  it("finds insights by keyword in title", () => {
    const results = searchInsights(db, "hooks");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.id === "INS-260320-0001")).toBe(true);

    db.close();
  });

  it("finds insights by keyword in one_line", () => {
    const results = searchInsights(db, "mental stimulation");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.id === "INS-260320-0003")).toBe(true);

    db.close();
  });

  it("finds insights by tag", () => {
    const results = searchInsights(db, "dfam");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.id === "INS-260320-0004")).toBe(true);

    db.close();
  });

  it("returns results ranked by relevance", () => {
    // Search for "cost" should rank cost-related insights higher
    const results = searchInsights(db, "cost models expensive");
    expect(results.length).toBeGreaterThanOrEqual(2);

    // The top results should be cost-related
    const costIds = results.slice(0, 2).map((r) => r.id);
    expect(
      costIds.includes("INS-260320-0002") ||
        costIds.includes("INS-260320-0005")
    ).toBe(true);

    db.close();
  });

  it("filters by domain", () => {
    const results = searchInsights(db, "hooks OR dogs OR DFAM", {
      domain: "ai-development",
    });

    // Should only return ai-development results
    for (const r of results) {
      expect(r.domain).toBe("ai-development");
    }

    // Should not contain pet or music-production results
    expect(results.some((r) => r.id === "INS-260320-0003")).toBe(false);
    expect(results.some((r) => r.id === "INS-260320-0004")).toBe(false);

    db.close();
  });

  it("filters by tag", () => {
    const results = searchInsights(db, "models cost", {
      tag: "cost-reduction",
    });

    for (const r of results) {
      expect(r.tags).toContain("cost-reduction");
    }

    db.close();
  });

  it("filters by minimum confidence", () => {
    // INS-0005 has confidence=medium, should be excluded with minConfidence=high
    const results = searchInsights(db, "cost models cheap expensive", {
      minConfidence: "high",
    });

    for (const r of results) {
      const rank = { pending: 0, low: 1, medium: 2, high: 3, very_high: 4 }[
        r.confidence
      ];
      expect(rank).toBeGreaterThanOrEqual(3);
    }

    db.close();
  });

  it("returns empty array for empty query", () => {
    const results = searchInsights(db, "");
    expect(results).toHaveLength(0);

    db.close();
  });

  it("returns empty array for whitespace-only query", () => {
    const results = searchInsights(db, "   ");
    expect(results).toHaveLength(0);

    db.close();
  });

  it("respects the limit option", () => {
    const results = searchInsights(db, "models OR hooks OR dogs OR DFAM", {
      limit: 2,
    });
    expect(results.length).toBeLessThanOrEqual(2);

    db.close();
  });

  it("returns full result fields", () => {
    const results = searchInsights(db, "hooks");
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

    db.close();
  });
});
