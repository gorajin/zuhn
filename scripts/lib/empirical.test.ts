import { describe, it, expect, afterEach } from "vitest";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type Database from "better-sqlite3";
import matter from "gray-matter";
import { initDb, upsertInsight } from "./db";
import { initVectorTable, upsertEmbedding } from "./vector-search";
import { propagateEmpiricalConfidence, propagateConfidence } from "./learning";
import type { InsightData } from "../schemas/frontmatter";

// ─── Helpers ────────────────────────────────────────────────────────

function createTestDb(): Database.Database {
  const db = initDb(":memory:");
  initVectorTable(db);
  return db;
}

function makeInsight(overrides: Partial<InsightData> = {}): InsightData {
  return {
    id: "INS-260320-0001", domain: "ai-development", topic: "claude-code",
    title: "Test insight", actionability: "immediate", confidence: "low",
    shelf_life: "evergreen", status: "active", tags: ["test"],
    sources: [{ type: "reddit", title: "Source A" }],
    date_extracted: "2026-03-20", last_accessed: null, access_count: 0,
    indexed: true, embedded: true,
    resolutions: { one_line: "Test one line", standard: "Test standard." },
    ...overrides,
  } as InsightData;
}

function syntheticEmbedding(seed: number, dim = 768): number[] {
  const vec = new Array(dim).fill(0.01);
  vec[seed % dim] = 1.0;
  vec[(seed * 7 + 3) % dim] = 0.8;
  vec[(seed * 13 + 11) % dim] = 0.6;
  return vec;
}

function similarEmbedding(base: number[], noise = 0.02): number[] {
  return base.map((v, i) => v + (i % 2 === 0 ? noise : -noise));
}

async function createKb(): Promise<string> {
  const dir = join(tmpdir(), `gyeol-emp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
  await mkdir(join(dir, "domains", "ai-development", "claude-code"), { recursive: true });
  await mkdir(join(dir, "principles", "investing"), { recursive: true });
  await mkdir(join(dir, "predictions"), { recursive: true });
  await mkdir(join(dir, "decisions"), { recursive: true });
  await mkdir(join(dir, "tensions"), { recursive: true });
  await mkdir(join(dir, "meta"), { recursive: true });
  return dir;
}

async function writeInsightFile(kbRoot: string, insight: InsightData): Promise<string> {
  const dir = join(kbRoot, "domains", insight.domain, insight.topic);
  await mkdir(dir, { recursive: true });
  const slug = insight.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const filePath = join(dir, `${slug}.md`);
  await writeFile(filePath, matter.stringify(insight.resolutions.standard, { ...insight }), "utf-8");
  return filePath;
}

// Writes prediction/principle/decision files using writeFileSync to avoid
// any async race conditions. Each file gets a unique random slug.

function writePredSync(kbRoot: string, overrides: Record<string, unknown> = {}): string {
  const { writeFileSync, mkdirSync } = require("node:fs");
  const dir = join(kbRoot, "predictions");
  mkdirSync(dir, { recursive: true });
  const data: Record<string, unknown> = {
    id: "PRED-260322-TEST", derived_from: ["PRI-260322-TEST"],
    claim: "Test prediction", falsifiable_metric: "Test metric",
    deadline: "2027-01-01", status: "active", date_created: "2026-03-22", tags: [],
    ...overrides,
  };
  const slug = `pred-${Math.random().toString(36).slice(2, 10)}`;
  const filePath = join(dir, `${slug}.md`);
  writeFileSync(filePath, matter.stringify("Test body", data), "utf-8");
  return filePath;
}

function writePriSync(kbRoot: string, overrides: Record<string, unknown> = {}): string {
  const { writeFileSync, mkdirSync } = require("node:fs");
  const dir = join(kbRoot, "principles", "investing");
  mkdirSync(dir, { recursive: true });
  const data: Record<string, unknown> = {
    id: "PRI-260322-TEST", domain: "investing", title: "Test principle",
    summary: "Test summary", confidence: "medium",
    supporting_insights: ["INS-260320-SI01", "INS-260320-SI02"],
    supporting_count: 2, tags: ["test"], date_created: "2026-03-22",
    last_reviewed: "2026-03-22",
    resolutions: { one_line: "Test", standard: "Test summary" },
    ...overrides,
  };
  const slug = `pri-${Math.random().toString(36).slice(2, 10)}`;
  const filePath = join(dir, `${slug}.md`);
  writeFileSync(filePath, matter.stringify("Test body", data), "utf-8");
  return filePath;
}

function writeDecSync(kbRoot: string, overrides: Record<string, unknown> = {}): string {
  const { writeFileSync, mkdirSync } = require("node:fs");
  const dir = join(kbRoot, "decisions");
  mkdirSync(dir, { recursive: true });
  const data: Record<string, unknown> = {
    id: "DEC-260322-TEST", date: "2026-03-22", context: "Test decision",
    options: ["Option A", "Option B"], choice: "Option A",
    informed_by: ["INS-260320-SI01", "PRI-260322-TEST"],
    outcome_date: "2026-06-22", status: "pending", tags: [],
    ...overrides,
  };
  const slug = `dec-${Math.random().toString(36).slice(2, 10)}`;
  const filePath = join(dir, `${slug}.md`);
  writeFileSync(filePath, matter.stringify("Test body", data), "utf-8");
  return filePath;
}

// ─── Tests ──────────────────────────────────────────────────────────

describe("propagateEmpiricalConfidence", () => {
  const cleanupDirs: string[] = [];

  afterEach(async () => {
    for (const dir of cleanupDirs) {
      await rm(dir, { recursive: true, force: true }).catch(() => {});
    }
    cleanupDirs.length = 0;
  });

  it("confirmed prediction boosts principle + supporting insights", async () => {
    const kbRoot = await createKb();
    cleanupDirs.push(kbRoot);
    const db = createTestDb();

    const priPath = writePriSync(kbRoot, { confidence: "medium" });
    const si1 = makeInsight({ id: "INS-260320-SI01", title: "Alpha insight", confidence: "low" });
    const si2 = makeInsight({ id: "INS-260320-SI02", title: "Beta insight", confidence: "medium" });
    const p1 = await writeInsightFile(kbRoot, si1);
    const p2 = await writeInsightFile(kbRoot, si2);
    upsertInsight(db, si1, p1);
    upsertInsight(db, si2, p2);

    writePredSync(kbRoot, { status: "confirmed" });

    await propagateEmpiricalConfidence(db, kbRoot);

    // Verify principle was boosted
    const priRaw = await readFile(priPath, "utf-8");
    expect(matter(priRaw).data.confidence).toBe("high");
    expect(matter(priRaw).data.empirical_state).toBe("confirmed");

    // Verify supporting insights were boosted (depth 1)
    const si1Raw = await readFile(p1, "utf-8");
    expect(matter(si1Raw).data.confidence).toBe("medium"); // low → medium
    expect(matter(si1Raw).data.empirical_state).toBe("confirmed");

    db.close();
  });

  it("falsified prediction drops principle ONLY (asymmetric depth 0)", async () => {
    const kbRoot = await createKb();
    cleanupDirs.push(kbRoot);
    const db = createTestDb();

    const priPath = writePriSync(kbRoot, { confidence: "high" });
    const si1 = makeInsight({ id: "INS-260320-SI01", title: "Kept insight", confidence: "high" });
    const p1 = await writeInsightFile(kbRoot, si1);
    upsertInsight(db, si1, p1);

    writePredSync(kbRoot, { status: "falsified", resolution_notes: "It failed" });

    await propagateEmpiricalConfidence(db, kbRoot);

    // Principle dropped
    const priRaw = await readFile(priPath, "utf-8");
    expect(matter(priRaw).data.confidence).toBe("medium");
    expect(matter(priRaw).data.empirical_state).toBe("falsified");

    // Supporting insight NOT dropped (asymmetric rule)
    const si1Raw = await readFile(p1, "utf-8");
    expect(matter(si1Raw).data.confidence).toBe("high"); // unchanged
    db.close();
  });

  it("falsified prediction spawns tension", async () => {
    const kbRoot = await createKb();
    cleanupDirs.push(kbRoot);
    const db = createTestDb();

    writePriSync(kbRoot, { confidence: "high" });
    writePredSync(kbRoot, { status: "falsified", resolution_notes: "Market stabilized" });

    await propagateEmpiricalConfidence(db, kbRoot);

    const tensionFiles = readdirSync(join(kbRoot, "tensions")).filter(f => f.endsWith(".md"));
    expect(tensionFiles.length).toBeGreaterThan(0);

    const tensionRaw = await readFile(join(kbRoot, "tensions", tensionFiles[0]), "utf-8");
    const { data } = matter(tensionRaw);
    expect(data.type).toBe("empirical_failure");
    expect(data.status).toBe("unresolved");
    db.close();
  });

  it("falsified prediction flips evergreen to time-sensitive", async () => {
    const kbRoot = await createKb();
    cleanupDirs.push(kbRoot);
    const db = createTestDb();

    const priPath = writePriSync(kbRoot, { confidence: "high", shelf_life: "evergreen" });
    writePredSync(kbRoot, { status: "falsified", resolution_notes: "Failed" });

    await propagateEmpiricalConfidence(db, kbRoot);

    const raw = await readFile(priPath, "utf-8");
    expect(matter(raw).data.shelf_life).toBe("time-sensitive");
    db.close();
  });

  it("caps confidence at very_high", async () => {
    const kbRoot = await createKb();
    cleanupDirs.push(kbRoot);
    const db = createTestDb();

    const priPath = writePriSync(kbRoot, { confidence: "very_high" });
    writePredSync(kbRoot, { status: "confirmed" });

    await propagateEmpiricalConfidence(db, kbRoot);

    const raw = await readFile(priPath, "utf-8");
    expect(matter(raw).data.confidence).toBe("very_high"); // unchanged
    db.close();
  });

  it("floors confidence at low, never pending", async () => {
    const kbRoot = await createKb();
    cleanupDirs.push(kbRoot);
    const db = createTestDb();

    const priPath = writePriSync(kbRoot, { confidence: "low" });
    writePredSync(kbRoot, { status: "falsified", resolution_notes: "Failed" });

    await propagateEmpiricalConfidence(db, kbRoot);

    const raw = await readFile(priPath, "utf-8");
    expect(matter(raw).data.confidence).toBe("low"); // floor
    db.close();
  });

  it("skips cascaded items (idempotency)", async () => {
    const kbRoot = await createKb();
    cleanupDirs.push(kbRoot);
    const db = createTestDb();

    writePriSync(kbRoot, { confidence: "medium" });
    writePredSync(kbRoot, { status: "confirmed", cascaded: true });

    const changes = await propagateEmpiricalConfidence(db, kbRoot);
    expect(changes).toHaveLength(0);
    db.close();
  });

  it("sets cascaded: true after processing", async () => {
    const kbRoot = await createKb();
    cleanupDirs.push(kbRoot);
    const db = createTestDb();

    writePriSync(kbRoot, { confidence: "medium" });
    const predPath = writePredSync(kbRoot, { status: "confirmed" });

    await propagateEmpiricalConfidence(db, kbRoot);

    const raw = await readFile(predPath, "utf-8");
    expect(matter(raw).data.cascaded).toBe(true);
    db.close();
  });

  it("prevents double-dip with processedIds guard", async () => {
    const kbRoot = await createKb();
    cleanupDirs.push(kbRoot);
    const db = createTestDb();

    const si1 = makeInsight({ id: "INS-260320-SI01", title: "Shared insight", confidence: "low" });
    const p1 = await writeInsightFile(kbRoot, si1);
    upsertInsight(db, si1, p1);

    writePriSync(kbRoot, { confidence: "medium", supporting_insights: ["INS-260320-SI01"] });
    writeDecSync(kbRoot, { status: "success", informed_by: ["PRI-260322-TEST", "INS-260320-SI01"] });

    await propagateEmpiricalConfidence(db, kbRoot);

    // Insight should only be boosted once (low → medium, not low → high)
    const si1Raw = await readFile(p1, "utf-8");
    expect(matter(si1Raw).data.confidence).toBe("medium");
    db.close();
  });

  it("marks mixed decisions as cascaded without changes", async () => {
    const kbRoot = await createKb();
    cleanupDirs.push(kbRoot);
    const db = createTestDb();

    writePriSync(kbRoot, { confidence: "medium" });
    const decPath = writeDecSync(kbRoot, { status: "mixed" });

    const changes = await propagateEmpiricalConfidence(db, kbRoot);
    expect(changes).toHaveLength(0);

    const raw = await readFile(decPath, "utf-8");
    expect(matter(raw).data.cascaded).toBe(true);
    db.close();
  });
});

describe("propagateConfidence with empirical_state guard", () => {
  const cleanupDirs: string[] = [];

  afterEach(async () => {
    for (const dir of cleanupDirs) {
      await rm(dir, { recursive: true, force: true }).catch(() => {});
    }
    cleanupDirs.length = 0;
  });

  it("skips falsified insights during structural confidence boost", async () => {
    const kbRoot = await createKb();
    cleanupDirs.push(kbRoot);
    const db = createTestDb();

    const insightA = makeInsight({
      id: "INS-260320-FAAA", title: "Falsified insight A", confidence: "low",
      empirical_state: "falsified",
      sources: [{ type: "reddit", title: "Source A" }],
      resolutions: { one_line: "Falsified claim", standard: "Standard A" },
    } as Partial<InsightData>);
    const insightB = makeInsight({
      id: "INS-260320-FBBB", title: "Corroborating insight B", confidence: "low",
      sources: [{ type: "youtube", title: "Source B" }],
      resolutions: { one_line: "Similar claim", standard: "Standard B" },
    });

    const pathA = await writeInsightFile(kbRoot, insightA);
    const pathB = await writeInsightFile(kbRoot, insightB);
    upsertInsight(db, insightA, pathA);
    upsertInsight(db, insightB, pathB);

    const baseEmb = syntheticEmbedding(42);
    upsertEmbedding(db, "INS-260320-FAAA", baseEmb);
    upsertEmbedding(db, "INS-260320-FBBB", similarEmbedding(baseEmb, 0.005));

    const changes = await propagateConfidence(db, kbRoot);
    const aChange = changes.find((c) => c.id === "INS-260320-FAAA");
    expect(aChange).toBeUndefined();
    db.close();
  });
});
