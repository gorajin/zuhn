#!/usr/bin/env npx tsx

import { join, dirname, basename } from "node:path";
import { rename, readFile, writeFile, mkdir } from "node:fs/promises";
import fg from "fast-glob";
import matter from "gray-matter";
import { InsightFrontmatter } from "./schemas/frontmatter.js";

const KB_ROOT = join(__dirname, "../knowledge-base");

// ─── Types ────────────────────────────────────────────────────────────

interface ArchiveCandidate {
  id: string;
  filePath: string;
  reason: "outdated" | "low-value" | "superseded";
  detail: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────

function daysSince(dateStr: string): number {
  const then = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Main ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");

  console.log("=== archive.ts ===");
  if (dryRun) {
    console.log("  (dry-run mode — no files will be moved)\n");
  }
  console.log(`Scanning: ${KB_ROOT}\n`);

  // 1. Scan all insight files
  const insightFiles = await fg("domains/**/*.md", {
    cwd: KB_ROOT,
    absolute: true,
    ignore: ["**/_overview.md", "**/_summary.md"],
  });

  interface InsightEntry {
    id: string;
    filePath: string;
    domain: string;
    topic: string;
    title: string;
    confidence: string;
    shelf_life: string;
    status: string;
    access_count: number;
    date_extracted: string;
    last_accessed: string | null;
  }

  const insights: InsightEntry[] = [];

  for (const filePath of insightFiles) {
    try {
      const raw = await readFile(filePath, "utf-8");
      const { data } = matter(raw);
      const validation = InsightFrontmatter.safeParse(data);
      if (validation.success) {
        const d = validation.data;
        insights.push({
          id: d.id,
          filePath,
          domain: d.domain,
          topic: d.topic,
          title: d.title,
          confidence: d.confidence,
          shelf_life: d.shelf_life,
          status: d.status,
          access_count: d.access_count,
          date_extracted: d.date_extracted,
          last_accessed: d.last_accessed,
        });
      }
    } catch {
      // Skip unreadable files
    }
  }

  console.log(`Found ${insights.length} insights.\n`);

  // 2. Apply archival rules
  const candidates: ArchiveCandidate[] = [];

  // Build a map of title -> insights for supersession detection
  const titleMap = new Map<string, InsightEntry[]>();
  for (const ins of insights) {
    const key = ins.title.toLowerCase().trim();
    if (!titleMap.has(key)) titleMap.set(key, []);
    titleMap.get(key)!.push(ins);
  }

  // Also group by domain/topic for supersession by topic
  const topicMap = new Map<string, InsightEntry[]>();
  for (const ins of insights) {
    const key = `${ins.domain}/${ins.topic}`;
    if (!topicMap.has(key)) topicMap.set(key, []);
    topicMap.get(key)!.push(ins);
  }

  const CONFIDENCE_RANK: Record<string, number> = {
    pending: 0,
    low: 1,
    medium: 2,
    high: 3,
    very_high: 4,
  };

  for (const ins of insights) {
    // Skip already non-active insights
    if (ins.status !== "active") continue;

    const age = daysSince(ins.date_extracted);
    const lastAccessed = ins.last_accessed
      ? daysSince(ins.last_accessed)
      : Infinity;

    // Rule 1: time-sensitive + not accessed in 90 days
    if (ins.shelf_life === "time-sensitive" && lastAccessed > 90) {
      candidates.push({
        id: ins.id,
        filePath: ins.filePath,
        reason: "outdated",
        detail: `time-sensitive, last accessed ${lastAccessed === Infinity ? "never" : `${lastAccessed} days ago`}`,
      });
      continue;
    }

    // Rule 2: low confidence + 0 access + age > 180 days
    if (ins.confidence === "low" && ins.access_count === 0 && age > 180) {
      candidates.push({
        id: ins.id,
        filePath: ins.filePath,
        reason: "low-value",
        detail: `low confidence, 0 accesses, ${age} days old`,
      });
      continue;
    }

    // Rule 3: superseded by another insight with the same title and higher confidence
    const sameTitle = titleMap.get(ins.title.toLowerCase().trim()) ?? [];
    const supersededBy = sameTitle.find(
      (other) =>
        other.id !== ins.id &&
        other.status === "active" &&
        CONFIDENCE_RANK[other.confidence] > CONFIDENCE_RANK[ins.confidence]
    );
    if (supersededBy) {
      candidates.push({
        id: ins.id,
        filePath: ins.filePath,
        reason: "superseded",
        detail: `superseded by ${supersededBy.id} (confidence: ${supersededBy.confidence})`,
      });
      continue;
    }
  }

  if (candidates.length === 0) {
    console.log("No insights eligible for archival.");
    return;
  }

  console.log(`${candidates.length} insight(s) eligible for archival:\n`);

  for (const c of candidates) {
    const relPath = c.filePath.replace(KB_ROOT + "/", "");
    const destDir = join(KB_ROOT, "archive", c.reason);
    const destPath = join(destDir, basename(c.filePath));

    console.log(`  ${c.id}: ${c.reason}`);
    console.log(`    ${c.detail}`);
    console.log(`    ${relPath} -> archive/${c.reason}/${basename(c.filePath)}`);

    if (!dryRun) {
      // Update status in frontmatter
      const raw = await readFile(c.filePath, "utf-8");
      const { data, content } = matter(raw);
      data.status = c.reason === "superseded" ? "superseded" : "outdated";
      const updated = matter.stringify(content, data);
      await writeFile(c.filePath, updated, "utf-8");

      // Move file
      await mkdir(destDir, { recursive: true });
      await rename(c.filePath, destPath);
      console.log(`    Archived.`);
    }
    console.log();
  }

  if (dryRun) {
    console.log("(dry-run complete — no files were moved)");
  } else {
    console.log(`Archived ${candidates.length} insight(s).`);
  }
}

main().catch((err) => {
  console.error("archive.ts failed:", err);
  process.exit(1);
});
