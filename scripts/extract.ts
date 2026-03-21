#!/usr/bin/env npx tsx

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { ExtractionInput } from "./schemas/extraction.js";
import { writeInsights } from "./lib/extract/write-insights.js";

const PROJECT_ROOT = join(__dirname, "..");
const KB_ROOT = join(PROJECT_ROOT, "knowledge-base");

// ─── Helpers ──────────────────────────────────────────────────────────

function usage(): never {
  console.error("Usage: extract.ts --source <SOURCE_ID> --file <JSON_FILE> [--post-ingest]");
  console.error("");
  console.error("  --source    Source ID (e.g. SRC-260320-8182)");
  console.error("  --file      Path to extraction JSON file");
  console.error("  --post-ingest  Run post-ingest pipeline after extraction");
  process.exit(1);
}

function parseArgs(argv: string[]): {
  source: string;
  file: string;
  postIngest: boolean;
} {
  let source = "";
  let file = "";
  let postIngest = false;

  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case "--source":
        source = argv[++i] || "";
        break;
      case "--file":
        file = argv[++i] || "";
        break;
      case "--post-ingest":
        postIngest = true;
        break;
    }
  }

  if (!source || !file) usage();
  return { source, file, postIngest };
}

// ─── Main ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const { source, file, postIngest } = parseArgs(process.argv);

  // 1. Read the JSON file
  let raw: string;
  try {
    raw = readFileSync(file, "utf-8");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Error: Cannot read file "${file}" — ${msg}`);
    process.exit(1);
  }

  // 2. Strip markdown code fences (Claude RLHF habit)
  raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  // 3. Parse JSON with truncation detection
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err: unknown) {
    if (err instanceof SyntaxError) {
      console.error(
        "Error: Malformed JSON — likely truncated. If extracting many insights, write in batches of 8-10."
      );
    } else {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Error: JSON parse failed — ${msg}`);
    }
    process.exit(1);
  }

  // 4. Validate against schema
  const validation = ExtractionInput.safeParse(parsed);
  if (!validation.success) {
    console.error("Error: Extraction JSON failed schema validation:");
    for (const issue of validation.error.issues) {
      const field = issue.path.join(".");
      console.error(`  ${field}: ${issue.message}`);
    }
    process.exit(1);
  }

  const input = validation.data;
  console.log(`Extracting ${input.insights.length} insights from source ${source}...`);

  // 5. Write insights
  const result = await writeInsights(input, source, KB_ROOT);

  // 6. Print summary
  console.log("");
  console.log(`Created: ${result.created} insight files`);
  if (result.newTopics.length > 0) {
    console.log(`New topics: ${result.newTopics.join(", ")}`);
  }
  if (result.errors.length > 0) {
    console.log(`Errors: ${result.errors.length}`);
    for (const err of result.errors) {
      console.error(`  ERROR: ${err}`);
    }
  }
  for (const f of result.files) {
    console.log(`  -> ${f}`);
  }

  // 7. Run post-ingest if requested
  if (postIngest) {
    console.log("\nRunning post-ingest pipeline...");
    try {
      execFileSync("npx", ["tsx", "scripts/post-ingest.ts"], {
        stdio: "inherit",
        cwd: PROJECT_ROOT,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Post-ingest failed: ${msg}`);
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error("extract.ts failed:", err);
  process.exit(1);
});
