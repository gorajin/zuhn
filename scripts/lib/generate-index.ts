import { join } from "node:path";
import fg from "fast-glob";
import { parseInsightFile, type ParseSuccess } from "./parse-insight";

// ─── scanInsights ────────────────────────────────────────────────────

/**
 * Glob `domains/**\/*.md` under `kbRoot`, ignoring `_overview.md` and
 * `_summary.md` index files. Parse each file and return only
 * successful parses.
 */
export async function scanInsights(kbRoot: string): Promise<ParseSuccess[]> {
  const pattern = "domains/**/*.md";
  const ignore = ["**/_overview.md", "**/_summary.md"];

  const files = await fg(pattern, {
    cwd: kbRoot,
    absolute: true,
    ignore,
  });

  const results = await Promise.all(files.map((f) => parseInsightFile(f)));

  return results.filter((r): r is ParseSuccess => r.success);
}

// ─── buildMasterIndex ────────────────────────────────────────────────

/**
 * Build the MASTER_INDEX.md content from all parsed insights.
 */
export function buildMasterIndex(insights: ParseSuccess[], principleCounts?: Map<string, number>): string {
  const now = new Date().toISOString().slice(0, 10);

  // Count unique sources
  const sourceSet = new Set<string>();
  for (const ins of insights) {
    for (const src of ins.data.sources) {
      sourceSet.add(src.title);
    }
  }

  // Gather domain stats
  const domainMap = new Map<
    string,
    { topics: Set<string>; count: number; principles: number; lastDate: string }
  >();

  for (const ins of insights) {
    const d = ins.data.domain;
    const entry = domainMap.get(d) ?? {
      topics: new Set<string>(),
      count: 0,
      principles: 0,
      lastDate: "",
    };
    entry.topics.add(ins.data.topic);
    entry.count += 1;
    if (ins.data.date_extracted > entry.lastDate) {
      entry.lastDate = ins.data.date_extracted;
    }
    domainMap.set(d, entry);
  }

  // Tag counts
  const tagCounts = new Map<string, number>();
  for (const ins of insights) {
    for (const tag of ins.data.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }
  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  // Recently added (last 7 days, sorted by date desc)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const recent = [...insights]
    .filter((i) => i.data.date_extracted >= sevenDaysAgo)
    .sort((a, b) =>
      b.data.date_extracted.localeCompare(a.data.date_extracted)
    );

  // Build markdown
  const lines: string[] = [];

  lines.push("# Knowledge Base Master Index");
  lines.push("");
  lines.push(
    `> Last rebuilt: ${now} | Total insights: ${insights.length} | Sources: ${sourceSet.size}`
  );
  lines.push("");

  // NOTE about access tracking
  lines.push(
    "**NOTE:** Access counts and last_accessed are updated automatically when insights are retrieved."
  );
  lines.push("");

  // Domain table
  lines.push("## Domains");
  lines.push("");
  lines.push("| Domain | Topics | Insights | Principles | Last Updated |");
  lines.push("| ------ | ------ | -------- | ---------- | ------------ |");
  for (const [domain, stats] of [...domainMap.entries()].sort()) {
    lines.push(
      `| ${domain} | ${stats.topics.size} | ${stats.count} | ${principleCounts?.get(domain) ?? stats.principles} | ${stats.lastDate} |`
    );
  }
  lines.push("");

  // Mental Models (placeholder)
  lines.push("## Mental Models");
  lines.push("");
  lines.push("_No mental models extracted yet._");
  lines.push("");

  // Top Tags (inline format)
  lines.push("## Top Tags");
  lines.push("");
  lines.push(topTags.map(([tag, count]) => `${tag}(${count})`).join(" "));
  lines.push("");

  // Flags (for Claude) (placeholder)
  lines.push("## Flags (for Claude)");
  lines.push("");
  lines.push("_No flags._");
  lines.push("");

  // Recently Added (last 7 days)
  lines.push("## Recently Added (last 7 days)");
  lines.push("");
  for (const ins of recent) {
    lines.push(
      `- \`${ins.data.id}\` ${ins.data.resolutions.one_line} _(${ins.data.date_extracted})_`
    );
  }
  lines.push("");

  return lines.join("\n");
}

// ─── buildDomainOverview ─────────────────────────────────────────────

/**
 * Build a domain _overview.md listing all topics with their insight
 * counts and preview one_lines.
 */
export function buildDomainOverview(
  domain: string,
  insights: ParseSuccess[]
): string {
  const topicMap = new Map<
    string,
    { count: number; previews: string[] }
  >();

  for (const ins of insights) {
    const t = ins.data.topic;
    const entry = topicMap.get(t) ?? { count: 0, previews: [] };
    entry.count += 1;
    entry.previews.push(ins.data.resolutions.one_line);
    topicMap.set(t, entry);
  }

  const lines: string[] = [];
  lines.push(`# Domain: ${domain}`);
  lines.push("");
  lines.push(`> ${insights.length} insights across ${topicMap.size} topics`);
  lines.push("");

  lines.push("## Topics");
  lines.push("");
  lines.push("| Topic | Insights | Preview |");
  lines.push("| ----- | -------- | ------- |");

  for (const [topic, stats] of [...topicMap.entries()].sort()) {
    const preview = stats.previews[0] ?? "";
    lines.push(`| ${topic} | ${stats.count} | ${preview} |`);
  }
  lines.push("");

  return lines.join("\n");
}

// ─── buildTopicSummary ───────────────────────────────────────────────

const CONFIDENCE_ORDER: Record<string, number> = {
  very_high: 0,
  high: 1,
  medium: 2,
  low: 3,
  pending: 4,
};

/**
 * Build a topic _summary.md listing insight one-liners sorted by
 * confidence (very_high first, pending last).
 */
export function buildTopicSummary(
  topic: string,
  insights: ParseSuccess[]
): string {
  const sorted = [...insights].sort(
    (a, b) =>
      (CONFIDENCE_ORDER[a.data.confidence] ?? 99) -
      (CONFIDENCE_ORDER[b.data.confidence] ?? 99)
  );

  const lines: string[] = [];
  lines.push(`# Topic: ${topic}`);
  lines.push("");
  lines.push(`> ${insights.length} insights`);
  lines.push("");

  for (const ins of sorted) {
    lines.push(
      `- \`${ins.data.id}\` [${ins.data.confidence}] ${ins.data.resolutions.one_line}`
    );
  }
  lines.push("");

  return lines.join("\n");
}

// ─── buildTagIndex ───────────────────────────────────────────────────

/**
 * Build a Map of tag name to markdown string listing all insights
 * that carry that tag.
 */
export function buildTagIndex(
  insights: ParseSuccess[]
): Map<string, string> {
  const tagMap = new Map<string, ParseSuccess[]>();

  for (const ins of insights) {
    for (const tag of ins.data.tags) {
      const list = tagMap.get(tag) ?? [];
      list.push(ins);
      tagMap.set(tag, list);
    }
  }

  const result = new Map<string, string>();

  for (const [tag, tagged] of tagMap) {
    const lines: string[] = [];
    lines.push(`# Tag: ${tag}`);
    lines.push("");
    for (const ins of tagged) {
      lines.push(
        `- \`${ins.data.id}\` ${ins.data.resolutions.one_line}`
      );
    }
    lines.push("");
    result.set(tag, lines.join("\n"));
  }

  return result;
}
