#!/usr/bin/env npx tsx

// Generates four filtered markdown views from the knowledge base:
//   1. action-list.md   — Insights with actionability=immediate + status=active
//   2. stale-board.md   — Insights with shelf_life=time-sensitive + age > 90 days
//   3. source-map.md    — Sources ranked by insight count
//   4. gap-report.md    — Rendered from GAP flags in meta/flags.md

import { join } from "node:path";
import { writeFile, readFile, mkdir } from "node:fs/promises";
import fg from "fast-glob";
import matter from "gray-matter";
import { initDb, type InsightRow } from "./lib/db";

const KB_ROOT = join(__dirname, "../knowledge-base");
const VIEWS_DIR = join(KB_ROOT, "views");
const FLAGS_PATH = join(KB_ROOT, "meta", "flags.md");
const SOURCES_DIR = join(KB_ROOT, "sources");

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(dateStr: string, now: Date): number {
  const then = new Date(dateStr);
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Action List ─────────────────────────────────────────────────────

function generateActionList(insights: InsightRow[]): string {
  const actionable = insights.filter(
    (i) => i.actionability === "immediate" && i.status === "active"
  );

  // Group by domain/topic
  const groups = new Map<string, InsightRow[]>();
  for (const i of actionable) {
    const key = `${i.domain}/${i.topic}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(i);
  }

  const lines: string[] = [];
  lines.push("# Action List");
  lines.push(`Generated on ${today()} | ${actionable.length} actionable insights`);
  lines.push("");

  for (const key of [...groups.keys()].sort()) {
    lines.push(`## ${key}`);
    for (const i of groups.get(key)!) {
      lines.push(`- [${i.id}] ${i.one_line}`);
    }
    lines.push("");
  }

  if (actionable.length === 0) {
    lines.push("No actionable insights found.");
    lines.push("");
  }

  return lines.join("\n");
}

// ─── Stale Board ─────────────────────────────────────────────────────

function generateStaleBoard(insights: InsightRow[]): string {
  const now = new Date();

  const stale = insights.filter((i) => {
    if (i.shelf_life !== "time-sensitive") return false;
    if (!i.date_extracted) return false;
    return daysBetween(i.date_extracted, now) > 90;
  });

  // Sort oldest first
  stale.sort((a, b) => {
    const aDays = a.date_extracted ? daysBetween(a.date_extracted, now) : 0;
    const bDays = b.date_extracted ? daysBetween(b.date_extracted, now) : 0;
    return bDays - aDays;
  });

  const lines: string[] = [];
  lines.push("# Stale Board");
  lines.push(`Generated on ${today()} | ${stale.length} stale insights`);
  lines.push("");
  lines.push("## Needs Review");

  for (const i of stale) {
    const days = i.date_extracted ? daysBetween(i.date_extracted, now) : 0;
    lines.push(`- [${i.id}] ${i.title} — extracted ${i.date_extracted}, ${days} days ago`);
  }

  if (stale.length === 0) {
    lines.push("No stale insights found.");
  }

  lines.push("");
  return lines.join("\n");
}

// ─── Source Map ──────────────────────────────────────────────────────

interface SourceInfo {
  title: string;
  type: string;
  date_ingested: string;
  insight_count: number;
}

async function generateSourceMap(): Promise<string> {
  const sourceFiles = await fg("sources/**/*.md", {
    cwd: KB_ROOT,
    ignore: ["sources/_index.md"],
  });

  const sources: SourceInfo[] = [];

  for (const relPath of sourceFiles) {
    const absPath = join(KB_ROOT, relPath);
    try {
      const content = await readFile(absPath, "utf-8");
      const { data } = matter(content);
      sources.push({
        title: data.title ?? relPath,
        type: data.type ?? "unknown",
        date_ingested: data.date_ingested ?? "unknown",
        insight_count: data.insight_count ?? 0,
      });
    } catch {
      // Skip files that can't be parsed
    }
  }

  // Sort by insight_count descending
  sources.sort((a, b) => b.insight_count - a.insight_count);

  const lines: string[] = [];
  lines.push("# Source Map");
  lines.push(`Generated on ${today()} | ${sources.length} sources`);
  lines.push("");
  lines.push("| Source | Type | Insights | Date |");
  lines.push("|--------|------|----------|------|");

  for (const s of sources) {
    lines.push(`| ${s.title} | ${s.type} | ${s.insight_count} | ${s.date_ingested} |`);
  }

  lines.push("");
  return lines.join("\n");
}

// ─── Gap Report ─────────────────────────────────────────────────────

async function generateGapReport(): Promise<string> {
  let flagsContent = "";
  try {
    flagsContent = await readFile(FLAGS_PATH, "utf-8");
  } catch {
    return `# Gap Report\nGenerated on ${today()}\n\nNo flags file found.\n`;
  }

  // Extract lines under ## GAP section
  const gapLines: string[] = [];
  let inGapSection = false;

  for (const line of flagsContent.split("\n")) {
    if (line.startsWith("## GAP")) {
      inGapSection = true;
      continue;
    }
    if (inGapSection && line.startsWith("## ")) {
      break;
    }
    if (inGapSection && line.startsWith("- ")) {
      gapLines.push(line);
    }
  }

  // Parse gap lines: "- topicA has N insights but related topicB has only M"
  interface GapEntry {
    topicA: string;
    countA: number;
    topicB: string;
    countB: number;
  }

  const gaps: GapEntry[] = [];
  const gapPattern = /^- (.+?) has (\d+) insights but related (.+?) has only (\d+)$/;

  for (const line of gapLines) {
    const match = line.match(gapPattern);
    if (match) {
      gaps.push({
        topicA: match[1],
        countA: parseInt(match[2], 10),
        topicB: match[3],
        countB: parseInt(match[4], 10),
      });
    }
  }

  const lines: string[] = [];
  lines.push("# Gap Report");
  lines.push(`Generated on ${today()}`);
  lines.push("");
  lines.push("## Coverage Gaps");

  if (gaps.length === 0) {
    lines.push("No coverage gaps detected.");
  } else {
    for (const g of gaps) {
      lines.push(
        `- ${g.topicA} (${g.countA} insights) \u2194 ${g.topicB} (${g.countB} insights)`
      );
    }
  }

  lines.push("");
  return lines.join("\n");
}

// ─── Main ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("=== views.ts ===");

  // Ensure views directory exists
  await mkdir(VIEWS_DIR, { recursive: true });

  // Open database
  const db = initDb();
  const allInsights = db
    .prepare("SELECT * FROM insights")
    .all() as InsightRow[];

  console.log(`Loaded ${allInsights.length} insights from database.`);

  // 1. Action List
  const actionList = generateActionList(allInsights);
  const actionPath = join(VIEWS_DIR, "action-list.md");
  await writeFile(actionPath, actionList, "utf-8");
  console.log(`  Written: views/action-list.md`);

  // 2. Stale Board
  const staleBoard = generateStaleBoard(allInsights);
  const stalePath = join(VIEWS_DIR, "stale-board.md");
  await writeFile(stalePath, staleBoard, "utf-8");
  console.log(`  Written: views/stale-board.md`);

  // 3. Source Map
  const sourceMap = await generateSourceMap();
  const sourcePath = join(VIEWS_DIR, "source-map.md");
  await writeFile(sourcePath, sourceMap, "utf-8");
  console.log(`  Written: views/source-map.md`);

  // 4. Gap Report
  const gapReport = await generateGapReport();
  const gapPath = join(VIEWS_DIR, "gap-report.md");
  await writeFile(gapPath, gapReport, "utf-8");
  console.log(`  Written: views/gap-report.md`);

  db.close();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("views.ts failed:", err);
  process.exit(1);
});
