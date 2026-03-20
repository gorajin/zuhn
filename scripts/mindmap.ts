#!/usr/bin/env npx tsx

// Mindmap generator for the Brain Engine knowledge base.
// Can be called standalone (`npx tsx scripts/mindmap.ts`) or
// integrated into post-ingest.ts as a pipeline step later.

import { join } from "node:path";
import { writeFile, mkdir } from "node:fs/promises";
import { scanInsights } from "./lib/generate-index.js";
import type { ParseSuccess } from "./lib/parse-insight.js";

const KB_ROOT = join(__dirname, "../knowledge-base");
const VIEWS_DIR = join(KB_ROOT, "views");

// ─── Scalability note ────────────────────────────────────────────────
// Current knowledge base has ~52 insights, so we show everything
// expanded (all domains, topics, and leaf insights).
// When the node count exceeds 200, switch the default view to show
// domains + topics only, with insights collapsed behind click-to-expand.
// The HTML initialExpandLevel option controls this (currently -1 = all).
const MAX_NODES_FULLY_EXPANDED = 200;

// ─── Build hierarchical markdown ────────────────────────────────────

const CONFIDENCE_ORDER: Record<string, number> = {
  very_high: 0,
  high: 1,
  medium: 2,
  low: 3,
  pending: 4,
};

const TOPIC_TRUNCATION_THRESHOLD = 50;
const TOPIC_TRUNCATION_SHOW = 20;

interface InsightEntry {
  oneLine: string;
  confidence: string;
}

function buildMindmapMarkdown(insights: ParseSuccess[]): string {
  // Group by domain -> topic -> InsightEntry[]
  const tree = new Map<string, Map<string, InsightEntry[]>>();

  for (const ins of insights) {
    const domain = ins.data.domain;
    const topic = ins.data.topic;
    const entry: InsightEntry = {
      oneLine: ins.data.resolutions.one_line,
      confidence: ins.data.confidence,
    };

    if (!tree.has(domain)) tree.set(domain, new Map());
    const topics = tree.get(domain)!;
    if (!topics.has(topic)) topics.set(topic, []);
    topics.get(topic)!.push(entry);
  }

  const lines: string[] = [];
  lines.push("# My Knowledge Map");
  lines.push("");

  // Sort domains, then topics within each domain, for deterministic output
  for (const domain of [...tree.keys()].sort()) {
    lines.push(`## ${domain}`);
    lines.push("");

    const topics = tree.get(domain)!;
    for (const topic of [...topics.keys()].sort()) {
      lines.push(`### ${topic}`);

      const entries = topics.get(topic)!;
      renderTopicEntries(lines, entries);
      lines.push("");
    }
  }

  return lines.join("\n");
}

function buildDomainMindmapMarkdown(domain: string, insights: ParseSuccess[]): string {
  // Group by topic -> InsightEntry[]
  const topicMap = new Map<string, InsightEntry[]>();

  for (const ins of insights) {
    const topic = ins.data.topic;
    const entry: InsightEntry = {
      oneLine: ins.data.resolutions.one_line,
      confidence: ins.data.confidence,
    };
    if (!topicMap.has(topic)) topicMap.set(topic, []);
    topicMap.get(topic)!.push(entry);
  }

  const lines: string[] = [];
  lines.push(`# ${domain}`);
  lines.push("");

  for (const topic of [...topicMap.keys()].sort()) {
    lines.push(`## ${topic}`);

    const entries = topicMap.get(topic)!;
    renderTopicEntries(lines, entries);
    lines.push("");
  }

  return lines.join("\n");
}

function renderTopicEntries(lines: string[], entries: InsightEntry[]): void {
  if (entries.length > TOPIC_TRUNCATION_THRESHOLD) {
    // Sort by confidence (best first) and show top N
    const sorted = [...entries].sort(
      (a, b) =>
        (CONFIDENCE_ORDER[a.confidence] ?? 99) -
        (CONFIDENCE_ORDER[b.confidence] ?? 99)
    );
    const shown = sorted.slice(0, TOPIC_TRUNCATION_SHOW);
    for (const e of shown) {
      lines.push(`- ${e.oneLine}`);
    }
    lines.push(`- _...and ${entries.length - TOPIC_TRUNCATION_SHOW} more..._`);
  } else {
    for (const e of entries) {
      lines.push(`- ${e.oneLine}`);
    }
  }
}

// ─── Build self-contained HTML viewer ───────────────────────────────

function buildMindmapHtml(markdown: string, totalNodes: number): string {
  // Escape backticks and backslashes for embedding in JS template literal
  const escapedMd = markdown
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$");

  // If under the cap, expand everything (-1). Otherwise expand to level 2
  // (domains + topics visible, insights collapsed).
  const expandLevel = totalNodes <= MAX_NODES_FULLY_EXPANDED ? -1 : 2;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Brain Engine — Knowledge Map</title>
  <style>
    body { margin: 0; background: #1a1a2e; }
    #mindmap { width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <svg id="mindmap"></svg>
  <script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
  <script src="https://cdn.jsdelivr.net/npm/markmap-view"></script>
  <script src="https://cdn.jsdelivr.net/npm/markmap-lib"></script>
  <script>
    const md = \`${escapedMd}\`;
    const { Transformer } = markmap;
    const { Markmap } = markmap;
    const transformer = new Transformer();
    const { root } = transformer.transform(md);
    const mm = Markmap.create('#mindmap', {
      colorFreezeLevel: 2,
      initialExpandLevel: ${expandLevel},
    }, root);
  </script>
</body>
</html>
`;
}

// ─── Main ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("=== mindmap.ts ===");
  console.log(`Scanning: ${KB_ROOT}`);

  const insights = await scanInsights(KB_ROOT);

  if (insights.length === 0) {
    console.log("0 valid insights found. Nothing to generate.");
    return;
  }

  console.log(`Found ${insights.length} valid insights.`);

  // Count total nodes: 1 root + domains + topics + insights
  const domainSet = new Set(insights.map((i) => i.data.domain));
  const topicSet = new Set(insights.map((i) => `${i.data.domain}/${i.data.topic}`));
  const totalNodes = 1 + domainSet.size + topicSet.size + insights.length;
  console.log(`Total mindmap nodes: ${totalNodes}`);

  if (totalNodes > MAX_NODES_FULLY_EXPANDED) {
    console.log(`  (exceeds ${MAX_NODES_FULLY_EXPANDED}-node cap — insights will be collapsed by default)`);
  }

  // Build markdown
  const markdown = buildMindmapMarkdown(insights);

  // Ensure views directory exists
  await mkdir(VIEWS_DIR, { recursive: true });

  // Write mindmap.md
  const mdPath = join(VIEWS_DIR, "mindmap.md");
  await writeFile(mdPath, markdown, "utf-8");
  console.log(`  Written: views/mindmap.md`);

  // Write mindmap.html
  const html = buildMindmapHtml(markdown, totalNodes);
  const htmlPath = join(VIEWS_DIR, "mindmap.html");
  await writeFile(htmlPath, html, "utf-8");
  console.log(`  Written: views/mindmap.html`);

  // Per-domain mindmap views
  const domainGroups = new Map<string, ParseSuccess[]>();
  for (const ins of insights) {
    const d = ins.data.domain;
    if (!domainGroups.has(d)) domainGroups.set(d, []);
    domainGroups.get(d)!.push(ins);
  }

  for (const [domain, domainInsights] of domainGroups) {
    const domainMd = buildDomainMindmapMarkdown(domain, domainInsights);
    const domainMdPath = join(VIEWS_DIR, `mindmap-${domain}.md`);
    await writeFile(domainMdPath, domainMd, "utf-8");
    console.log(`  Written: views/mindmap-${domain}.md`);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("mindmap.ts failed:", err);
  process.exit(1);
});
