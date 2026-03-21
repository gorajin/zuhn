#!/usr/bin/env npx tsx

import { readFileSync } from "node:fs";
import { join } from "node:path";
import fg from "fast-glob";
import matter from "gray-matter";

const PROJECT_ROOT = join(__dirname, "..");
const KB_ROOT = join(PROJECT_ROOT, "knowledge-base");

// ─── Types ───────────────────────────────────────────────────────────

interface CompressTarget {
  domain: string;
  topic: string;
}

interface InsightEntry {
  id: string;
  oneLine: string;
}

interface PrincipleEntry {
  id: string;
  oneLine: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function usage(): never {
  console.error("Usage: compress.ts [--topic domain/topic]");
  console.error("");
  console.error("  --topic    Domain/topic to compress (e.g. ai-development/claude-code)");
  console.error("");
  console.error("If no --topic is provided, lists all COMPRESS flags from meta/flags.md.");
  process.exit(1);
}

function parseArgs(argv: string[]): { topic: string | null } {
  let topic: string | null = null;

  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case "--topic":
        topic = argv[++i] || "";
        break;
      case "--help":
      case "-h":
        usage();
        break;
    }
  }

  return { topic };
}

/**
 * Parses meta/flags.md to extract COMPRESS entries.
 * Each COMPRESS line has the format:
 *   - domain/topic — N insights, M principles (ratio)
 */
function parseCompressFlags(): CompressTarget[] {
  const flagsPath = join(KB_ROOT, "meta", "flags.md");
  let raw: string;
  try {
    raw = readFileSync(flagsPath, "utf-8");
  } catch {
    console.error("Error: Cannot read meta/flags.md");
    process.exit(1);
  }

  const targets: CompressTarget[] = [];

  // Find the ## COMPRESS section
  const lines = raw.split("\n");
  let inCompressSection = false;

  for (const line of lines) {
    if (line.startsWith("## COMPRESS")) {
      inCompressSection = true;
      continue;
    }
    if (line.startsWith("## ") && inCompressSection) {
      break; // hit next section
    }
    if (!inCompressSection) continue;

    // Match lines like "- ai-development/claude-code — 27 insights, 3 principles"
    const match = line.match(/^- ([a-z0-9-]+)\/([a-z0-9-]+)/);
    if (match) {
      targets.push({ domain: match[1], topic: match[2] });
    }
  }

  return targets;
}

/**
 * Reads all insight files for a given domain/topic and extracts id + one_line.
 */
async function loadInsights(domain: string, topic: string): Promise<InsightEntry[]> {
  const topicDir = join(KB_ROOT, "domains", domain, topic);
  const files = await fg("*.md", {
    cwd: topicDir,
    absolute: true,
    ignore: ["_summary.md", "_overview.md"],
  });

  const insights: InsightEntry[] = [];

  for (const filePath of files) {
    try {
      const raw = readFileSync(filePath, "utf-8");
      const { data } = matter(raw);
      if (data.id && data.resolutions?.one_line) {
        insights.push({
          id: data.id as string,
          oneLine: data.resolutions.one_line as string,
        });
      }
    } catch {
      // skip unreadable files
    }
  }

  // Sort by ID for stable output
  insights.sort((a, b) => a.id.localeCompare(b.id));
  return insights;
}

/**
 * Reads all principle files for a given domain and extracts id + one_line.
 */
async function loadPrinciples(domain: string): Promise<PrincipleEntry[]> {
  const principlesDir = join(KB_ROOT, "principles", domain);
  let files: string[];
  try {
    files = await fg("*.md", {
      cwd: principlesDir,
      absolute: true,
      ignore: ["_index.md"],
    });
  } catch {
    return []; // no principles directory
  }

  const principles: PrincipleEntry[] = [];

  for (const filePath of files) {
    try {
      const raw = readFileSync(filePath, "utf-8");
      const { data } = matter(raw);
      if (data.id && data.resolutions?.one_line) {
        principles.push({
          id: data.id as string,
          oneLine: data.resolutions.one_line as string,
        });
      }
    } catch {
      // skip unreadable files
    }
  }

  principles.sort((a, b) => a.id.localeCompare(b.id));
  return principles;
}

/**
 * Outputs the structured compression prompt to stdout.
 */
function printCompressionPrompt(
  domain: string,
  topic: string,
  insights: InsightEntry[],
  principles: PrincipleEntry[]
): void {
  const label = `${domain}/${topic}`;
  const pad = label.length + 20;
  const border = "═".repeat(pad);

  console.log(`╔${border}╗`);
  console.log(`║       Compression: ${label.padEnd(pad - 15)}║`);
  console.log(`╚${border}╝`);
  console.log();

  // Insights section
  console.log(`## Insights to Compress (${insights.length} total)`);
  console.log();
  for (let i = 0; i < insights.length; i++) {
    console.log(`${i + 1}. [${insights[i].id}] "${insights[i].oneLine}"`);
  }
  console.log();

  // Principles section
  console.log(`## Existing Principles (${principles.length} total)`);
  console.log();
  if (principles.length === 0) {
    console.log("No existing principles for this domain.");
  } else {
    for (let i = 0; i < principles.length; i++) {
      console.log(`${i + 1}. [${principles[i].id}] "${principles[i].oneLine}"`);
    }
  }
  console.log();

  // Task instructions
  console.log("## Your Task");
  console.log();
  console.log("Read the insights above. Identify 1-3 common patterns or rules that multiple insights support. For each pattern:");
  console.log("- Give it a clear, actionable title");
  console.log("- Write a 2-3 sentence summary");
  console.log("- List the supporting insight IDs");
  console.log("- Choose tags that capture the concept");
  console.log();
  console.log("Write the result as JSON to /tmp/zuhn-principles.json, then run:");
  console.log("npx tsx scripts/create-principles.ts --file /tmp/zuhn-principles.json --post-ingest");
  console.log();
  console.log("Do NOT create principles that duplicate existing ones listed above.");
  console.log();
  console.log("JSON format:");
  console.log("```json");
  console.log(JSON.stringify({
    principles: [
      {
        domain: domain,
        title: "Short principle title",
        summary: "2-3 sentence summary of the principle",
        confidence: "high",
        supporting_insights: ["INS-XXXXXX-XXXX", "INS-XXXXXX-XXXX"],
        tags: ["tag1", "tag2"],
      },
    ],
  }, null, 2));
  console.log("```");
}

// ─── Main ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const { topic } = parseArgs(process.argv);

  if (!topic) {
    // List mode: show all COMPRESS flags
    const targets = parseCompressFlags();

    if (targets.length === 0) {
      console.log("No COMPRESS flags found in meta/flags.md.");
      console.log("Run `npm run learn` to detect topics ready for compression.");
      process.exit(0);
    }

    console.log("Topics flagged for compression:\n");
    for (let i = 0; i < targets.length; i++) {
      console.log(`  ${i + 1}. ${targets[i].domain}/${targets[i].topic}`);
    }
    console.log("\nRe-run with --topic to compress:");
    console.log("  npx tsx scripts/compress.ts --topic <domain/topic>");
    process.exit(0);
  }

  // Parse domain/topic
  const parts = topic.split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    console.error(`Error: --topic must be in "domain/topic" format (got "${topic}")`);
    process.exit(1);
  }

  const [domain, topicName] = parts;

  // Load data
  const insights = await loadInsights(domain, topicName);
  if (insights.length === 0) {
    console.error(`Error: No insights found for ${domain}/${topicName}`);
    process.exit(1);
  }

  const principles = await loadPrinciples(domain);

  // Output the compression prompt
  printCompressionPrompt(domain, topicName, insights, principles);
}

main().catch((err) => {
  console.error("compress.ts failed:", err);
  process.exit(1);
});
