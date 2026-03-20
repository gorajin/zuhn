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

function buildMindmapMarkdown(insights: ParseSuccess[]): string {
  // Group by domain -> topic -> one_line[]
  const tree = new Map<string, Map<string, string[]>>();

  for (const ins of insights) {
    const domain = ins.data.domain;
    const topic = ins.data.topic;
    const oneLine = ins.data.resolutions.one_line;

    if (!tree.has(domain)) tree.set(domain, new Map());
    const topics = tree.get(domain)!;
    if (!topics.has(topic)) topics.set(topic, []);
    topics.get(topic)!.push(oneLine);
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

      const oneLines = topics.get(topic)!;
      for (const ol of oneLines) {
        lines.push(`- ${ol}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
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

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("mindmap.ts failed:", err);
  process.exit(1);
});
