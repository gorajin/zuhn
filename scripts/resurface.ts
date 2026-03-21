#!/usr/bin/env npx tsx

// Spaced resurfacing: selects 5-10 insights for review based on a
// weighted priority formula (age, confidence, access frequency).
// Outputs a daily digest to views/daily-digest.md and stdout.

import { join } from "node:path";
import { writeFile, mkdir } from "node:fs/promises";
import { initDb, type InsightRow } from "./lib/db";

const KB_ROOT = join(__dirname, "../knowledge-base");
const VIEWS_DIR = join(KB_ROOT, "views");

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Priority scoring ───────────────────────────────────────────────

const CONFIDENCE_RANK: Record<string, number> = {
  pending: 0,
  low: 1,
  medium: 2,
  high: 3,
  very_high: 4,
};

interface ScoredInsight {
  insight: InsightRow;
  ageScore: number;
  confidenceScore: number;
  accessScore: number;
  total: number;
}

function computeScore(insight: InsightRow, now: Date): ScoredInsight {
  // age_score: days since last_accessed (max 365, null = 365)
  let ageScore: number;
  if (!insight.last_accessed) {
    ageScore = 365;
  } else {
    const lastAccessed = new Date(insight.last_accessed);
    const daysSince = Math.floor(
      (now.getTime() - lastAccessed.getTime()) / (1000 * 60 * 60 * 24)
    );
    ageScore = Math.min(daysSince, 365);
  }

  // confidence_score: (4 - confidence_rank) * 50
  const rank = CONFIDENCE_RANK[insight.confidence] ?? 2;
  const confidenceScore = (4 - rank) * 50;

  // access_score: 0 accesses = 100, else max(0, 50 - access_count * 5)
  const accessScore =
    insight.access_count === 0
      ? 100
      : Math.max(0, 50 - insight.access_count * 5);

  const total = ageScore + confidenceScore + accessScore;

  return { insight, ageScore, confidenceScore, accessScore, total };
}

// ─── Digest generation ──────────────────────────────────────────────

function generateDigest(scored: ScoredInsight[]): string {
  const lines: string[] = [];
  lines.push("# Daily Digest");
  lines.push(`Generated on ${today()} | ${scored.length} insights to review`);
  lines.push("");
  lines.push("## Insights for Review");
  lines.push("");

  for (let i = 0; i < scored.length; i++) {
    const { insight } = scored[i];
    const lastSeen = insight.last_accessed ?? "never";

    lines.push(`### ${i + 1}. ${insight.title}`);
    lines.push(
      `**Domain:** ${insight.domain}/${insight.topic} | **Confidence:** ${insight.confidence} | **Last seen:** ${lastSeen}`
    );
    lines.push(`> ${insight.one_line}`);
    lines.push("");
    lines.push(`File: \`${insight.file_path}\``);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

// ─── Main ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("=== resurface.ts ===");

  // Ensure views directory exists
  await mkdir(VIEWS_DIR, { recursive: true });

  // Open database and get active insights
  const db = initDb();
  const activeInsights = db
    .prepare("SELECT * FROM insights WHERE status = 'active'")
    .all() as InsightRow[];

  console.log(`Found ${activeInsights.length} active insights.`);

  if (activeInsights.length === 0) {
    console.log("No active insights to resurface.");
    db.close();
    return;
  }

  // Score and sort
  const now = new Date();
  const scored = activeInsights
    .map((i) => computeScore(i, now))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  console.log(`Selected top ${scored.length} insights for review.\n`);

  // Generate digest
  const digest = generateDigest(scored);

  // Write to file
  const digestPath = join(VIEWS_DIR, "daily-digest.md");
  await writeFile(digestPath, digest, "utf-8");
  console.log(`Written: views/daily-digest.md\n`);

  // Print to stdout
  console.log(digest);

  db.close();
}

main().catch((err) => {
  console.error("resurface.ts failed:", err);
  process.exit(1);
});
