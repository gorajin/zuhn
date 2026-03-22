#!/usr/bin/env npx tsx

import { readFileSync, existsSync } from "node:fs";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import matter from "gray-matter";
import { DecisionInput } from "./schemas/empirical.js";
import { generateDecisionId } from "./lib/generate-id.js";
import { slugify } from "./lib/ingest/slug.js";

const PROJECT_ROOT = join(__dirname, "..");
const KB_ROOT = join(PROJECT_ROOT, "knowledge-base");

// ─── Helpers ─────────────────────────────────────────────────────────

function usage(): never {
  console.error("Usage: decide.ts --file <JSON_FILE> [--post-ingest]");
  console.error("");
  console.error("  --file         Path to JSON file with decisions array");
  console.error("  --post-ingest  Run post-ingest pipeline after creation");
  process.exit(1);
}

function parseArgs(argv: string[]): {
  file: string;
  postIngest: boolean;
} {
  let file = "";
  let postIngest = false;

  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case "--file":
        file = argv[++i] || "";
        break;
      case "--post-ingest":
        postIngest = true;
        break;
    }
  }

  if (!file) usage();
  return { file, postIngest };
}

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ─── Main ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const { file, postIngest } = parseArgs(process.argv);

  let raw: string;
  try {
    raw = readFileSync(file, "utf-8");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Error: Cannot read file "${file}" — ${msg}`);
    process.exit(1);
  }

  raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error("Error: Malformed JSON. Check the file and try again.");
    process.exit(1);
  }

  const validation = DecisionInput.safeParse(parsed);
  if (!validation.success) {
    console.error("Error: Decision JSON failed schema validation:");
    for (const issue of validation.error.issues) {
      const field = issue.path.join(".");
      console.error(`  ${field}: ${issue.message}`);
    }
    process.exit(1);
  }

  const input = validation.data;
  console.log(`Creating ${input.decisions.length} decision(s)...\n`);

  const today = todayISO();
  const decisionsDir = join(KB_ROOT, "decisions");
  await mkdir(decisionsDir, { recursive: true });

  let created = 0;

  for (let index = 0; index < input.decisions.length; index++) {
    const dec = input.decisions[index];
    const salt = `${Date.now()}-${index}`;
    const id = generateDecisionId(dec.context, salt);
    let slug = slugify(dec.context);

    let filePath = join(decisionsDir, `${slug}.md`);
    if (existsSync(filePath)) {
      const hashSuffix = id.split("-").pop()!.toLowerCase();
      slug = `${slug}-${hashSuffix}`;
      filePath = join(decisionsDir, `${slug}.md`);
    }

    const frontmatter: Record<string, unknown> = {
      id,
      date: today,
      context: dec.context,
      options: dec.options,
      choice: dec.choice,
      informed_by: dec.informed_by,
      outcome_date: dec.outcome_date,
      status: "pending",
      tags: dec.tags || [],
    };

    const body = dec.body || "";
    const fileContent = matter.stringify(body, frontmatter);
    await writeFile(filePath, fileContent, "utf-8");

    console.log(`  -> ${filePath}`);
    created++;
  }

  console.log(`\nCreated: ${created} decision file(s)`);

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
  console.error("decide.ts failed:", err);
  process.exit(1);
});
