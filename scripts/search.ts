#!/usr/bin/env npx tsx

import { initDb } from "./lib/db";
import { searchInsights, type SearchOptions } from "./lib/search";

// ─── Arg parsing ────────────────────────────────────────────────────

function parseArgs(argv: string[]): { query: string; options: SearchOptions } {
  const args = argv.slice(2); // skip node + script path
  const options: SearchOptions = {};
  const queryParts: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--domain" && i + 1 < args.length) {
      options.domain = args[++i];
    } else if (arg === "--tag" && i + 1 < args.length) {
      options.tag = args[++i];
    } else if (arg === "--limit" && i + 1 < args.length) {
      options.limit = parseInt(args[++i], 10);
    } else if (arg === "--confidence" && i + 1 < args.length) {
      options.minConfidence = args[++i];
    } else if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    } else {
      queryParts.push(arg);
    }
  }

  return { query: queryParts.join(" "), options };
}

function printUsage(): void {
  console.log(`
Usage: npx tsx scripts/search.ts <query> [options]

Options:
  --domain <domain>       Filter by domain (e.g. ai-development, pets)
  --tag <tag>             Filter by tag (e.g. hooks, llm-costs)
  --limit <n>             Max results (default: 10)
  --confidence <level>    Minimum confidence (pending|low|medium|high|very_high)
  --help, -h              Show this help message

Examples:
  npx tsx scripts/search.ts "reduce LLM costs"
  npx tsx scripts/search.ts "hooks" --domain ai-development
  npx tsx scripts/search.ts "planning" --limit 5
  npx tsx scripts/search.ts "cost" --confidence high
`);
}

// ─── Main ───────────────────────────────────────────────────────────

function main(): void {
  const { query, options } = parseArgs(process.argv);

  if (!query) {
    console.error("Error: No search query provided.\n");
    printUsage();
    process.exit(1);
  }

  const db = initDb();
  const results = searchInsights(db, query, options);

  const limit = options.limit ?? 10;
  console.log(
    `\n\uD83D\uDD0D Search: "${query}" (${results.length} result${results.length !== 1 ? "s" : ""})`
  );

  if (options.domain) console.log(`   Filter: domain=${options.domain}`);
  if (options.tag) console.log(`   Filter: tag=${options.tag}`);
  if (options.minConfidence)
    console.log(`   Filter: confidence>=${options.minConfidence}`);
  console.log();

  if (results.length === 0) {
    console.log("   No results found.\n");
    db.close();
    return;
  }

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const tags = r.tags
      .split(" ")
      .join(", ");
    console.log(
      `${i + 1}. [${r.id}] ${r.one_line}`
    );
    console.log(
      `   ${r.domain}/${r.topic} | confidence: ${r.confidence} | tags: ${tags}`
    );
    console.log();
  }

  db.close();
}

main();
