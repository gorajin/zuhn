#!/usr/bin/env npx tsx

import { initDb } from "./lib/db";
import { searchInsights, type SearchOptions } from "./lib/search";
import { isOllamaAvailable, embedText } from "./lib/embeddings";
import {
  initVectorTable,
  vectorSearch,
  hybridSearch,
  type HybridResult,
} from "./lib/vector-search";

// ─── Types ──────────────────────────────────────────────────────────

type SearchMode = "keyword" | "semantic" | "hybrid";

interface ParsedArgs {
  query: string;
  mode: SearchMode;
  options: SearchOptions;
}

// ─── Arg parsing ────────────────────────────────────────────────────

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2); // skip node + script path
  const options: SearchOptions = {};
  const queryParts: string[] = [];
  let mode: SearchMode = "keyword";

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
    } else if (arg === "--semantic") {
      mode = "semantic";
    } else if (arg === "--hybrid") {
      mode = "hybrid";
    } else if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    } else {
      queryParts.push(arg);
    }
  }

  return { query: queryParts.join(" "), mode, options };
}

function printUsage(): void {
  console.log(`
Usage: npx tsx scripts/search.ts <query> [options]

Search Modes:
  (default)             FTS5 keyword search (BM25 ranking)
  --semantic            Vector-only search (cosine similarity via Ollama)
  --hybrid              Hybrid RRF search (keyword + semantic merged)

Options:
  --domain <domain>       Filter by domain (e.g. ai-development, pets)
  --tag <tag>             Filter by tag (e.g. hooks, llm-costs)
  --limit <n>             Max results (default: 10)
  --confidence <level>    Minimum confidence (pending|low|medium|high|very_high)
  --help, -h              Show this help message

Examples:
  npx tsx scripts/search.ts "reduce LLM costs"
  npx tsx scripts/search.ts "hooks" --domain ai-development
  npx tsx scripts/search.ts "planning" --semantic
  npx tsx scripts/search.ts "cost optimization" --hybrid
  npx tsx scripts/search.ts "cost" --hybrid --domain ai-development
`);
}

// ─── Display helpers ────────────────────────────────────────────────

function displayKeywordResults(
  results: Array<{ id: string; one_line: string; domain: string; topic: string; confidence: string; tags: string }>,
  query: string,
  options: SearchOptions
): void {
  console.log(
    `\nSearch [keyword]: "${query}" (${results.length} result${results.length !== 1 ? "s" : ""})`
  );
  printFilters(options);

  if (results.length === 0) {
    console.log("   No results found.\n");
    return;
  }

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const tags = r.tags.split(" ").join(", ");
    console.log(`${i + 1}. [${r.id}] ${r.one_line}`);
    console.log(
      `   ${r.domain}/${r.topic} | confidence: ${r.confidence} | tags: ${tags}`
    );
    console.log();
  }
}

function displaySemanticResults(
  results: Array<{ id: string; distance: number }>,
  query: string,
  db: ReturnType<typeof initDb>
): void {
  console.log(
    `\nSearch [semantic]: "${query}" (${results.length} result${results.length !== 1 ? "s" : ""})`
  );

  if (results.length === 0) {
    console.log("   No results found.\n");
    return;
  }

  const stmt = db.prepare(
    "SELECT id, one_line, domain, topic, confidence, tags FROM insights WHERE id = ?"
  );

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const row = stmt.get(r.id) as {
      id: string;
      one_line: string;
      domain: string;
      topic: string;
      confidence: string;
      tags: string;
    } | undefined;

    if (!row) continue;

    const tags = row.tags.split(" ").join(", ");
    const similarity = (1 - r.distance).toFixed(4);
    console.log(`${i + 1}. [${row.id}] [semantic] ${row.one_line}`);
    console.log(
      `   ${row.domain}/${row.topic} | confidence: ${row.confidence} | similarity: ${similarity} | tags: ${tags}`
    );
    console.log();
  }
}

function displayHybridResults(
  results: HybridResult[],
  query: string,
  options: SearchOptions
): void {
  console.log(
    `\nSearch [hybrid]: "${query}" (${results.length} result${results.length !== 1 ? "s" : ""})`
  );
  printFilters(options);

  if (results.length === 0) {
    console.log("   No results found.\n");
    return;
  }

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const tags = r.tags.split(" ").join(", ");
    const matchLabel =
      r.match_type === "both"
        ? "[both]"
        : r.match_type === "keyword"
          ? "[keyword]"
          : "[semantic]";
    console.log(`${i + 1}. [${r.id}] ${matchLabel} ${r.one_line}`);
    console.log(
      `   ${r.domain}/${r.topic} | confidence: ${r.confidence} | score: ${r.score.toFixed(6)} | tags: ${tags}`
    );
    console.log();
  }
}

function printFilters(options: SearchOptions): void {
  if (options.domain) console.log(`   Filter: domain=${options.domain}`);
  if (options.tag) console.log(`   Filter: tag=${options.tag}`);
  if (options.minConfidence)
    console.log(`   Filter: confidence>=${options.minConfidence}`);
  console.log();
}

// ─── Main ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const { query, mode, options } = parseArgs(process.argv);

  if (!query) {
    console.error("Error: No search query provided.\n");
    printUsage();
    process.exit(1);
  }

  const db = initDb();

  if (mode === "keyword") {
    // Standard FTS5 search — no Ollama needed
    const results = searchInsights(db, query, options);
    displayKeywordResults(results, query, options);
    db.close();
    return;
  }

  // Semantic or hybrid mode — requires Ollama
  const available = await isOllamaAvailable();
  if (!available) {
    console.error(
      "Error: Ollama is not running. Semantic/hybrid search requires Ollama.\n"
    );
    console.error("Start Ollama and try again, or use keyword search (default).\n");
    db.close();
    process.exit(1);
  }

  // Load vec extension and embed the query
  initVectorTable(db);
  const queryEmbedding = await embedText(query);

  if (mode === "semantic") {
    const limit = options.limit ?? 10;
    const results = vectorSearch(db, queryEmbedding, limit);
    displaySemanticResults(results, query, db);
  } else {
    // hybrid
    const results = hybridSearch(db, query, queryEmbedding, {
      limit: options.limit,
      domain: options.domain,
      tag: options.tag,
    });
    displayHybridResults(results, query, options);
  }

  db.close();
}

main().catch((err) => {
  console.error("search.ts failed:", err);
  process.exit(1);
});
