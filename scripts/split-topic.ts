#!/usr/bin/env npx tsx

import { readFileSync, writeFileSync, mkdirSync, renameSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import matter from "gray-matter";

const PROJECT_ROOT = join(__dirname, "..");
const KB_ROOT = join(PROJECT_ROOT, "knowledge-base");

// ─── Helpers ──────────────────────────────────────────────────────────

function usage(): never {
  console.error("Usage: split-topic.ts --from <domain/topic> --to <new-topic> --files <file1,file2,...>");
  console.error("");
  console.error("  --from     Source topic path (e.g. ai-development/future-of-work)");
  console.error("  --to       New topic name (e.g. ai-market-dynamics)");
  console.error("  --files    Comma-separated list of filenames (without path) to move");
  console.error("  --dry-run  Show what would happen without making changes");
  process.exit(1);
}

function parseArgs(argv: string[]): {
  from: string;
  to: string;
  files: string[];
  dryRun: boolean;
} {
  let from = "";
  let to = "";
  let files: string[] = [];
  let dryRun = false;

  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case "--from":
        from = argv[++i] || "";
        break;
      case "--to":
        to = argv[++i] || "";
        break;
      case "--files":
        files = (argv[++i] || "").split(",").map((f) => f.trim()).filter(Boolean);
        break;
      case "--dry-run":
        dryRun = true;
        break;
    }
  }

  if (!from || !to || files.length === 0) usage();
  return { from, to, files, dryRun };
}

// ─── Main ─────────────────────────────────────────────────────────────

const { from, to, files, dryRun } = parseArgs(process.argv);

const [domain, _sourceTopic] = from.split("/");
if (!domain || !_sourceTopic) {
  console.error(`Error: --from must be domain/topic format, got: ${from}`);
  process.exit(1);
}

const sourceDir = join(KB_ROOT, "domains", domain, _sourceTopic);
const targetDir = join(KB_ROOT, "domains", domain, to);

if (!existsSync(sourceDir)) {
  console.error(`Error: source directory does not exist: ${sourceDir}`);
  process.exit(1);
}

// Create target directory
if (!dryRun) {
  mkdirSync(targetDir, { recursive: true });
}

console.log(`Splitting ${from} → ${domain}/${to}`);
console.log(`  ${files.length} files to move`);
if (dryRun) console.log("  (DRY RUN — no changes will be made)\n");
else console.log("");

let moved = 0;
let errors = 0;

for (const filename of files) {
  const sourcePath = join(sourceDir, filename);

  if (!existsSync(sourcePath)) {
    console.error(`  SKIP: ${filename} — file not found`);
    errors++;
    continue;
  }

  // Read and parse frontmatter
  const raw = readFileSync(sourcePath, "utf-8");
  const { data, content } = matter(raw);

  // Update topic field
  const oldTopic = data.topic;
  data.topic = to;

  // Mark as needing re-embedding since topic changed
  data.embedded = false;

  // Write updated file to target directory
  const targetPath = join(targetDir, filename);
  const updated = matter.stringify(content, data);

  if (dryRun) {
    console.log(`  WOULD MOVE: ${filename}`);
    console.log(`    topic: ${oldTopic} → ${to}`);
  } else {
    writeFileSync(targetPath, updated);
    // Remove from source directory
    const { unlinkSync } = require("node:fs");
    unlinkSync(sourcePath);
    console.log(`  MOVED: ${filename} (topic: ${oldTopic} → ${to})`);
  }
  moved++;
}

console.log(`\nDone. ${moved} files ${dryRun ? "would be " : ""}moved, ${errors} errors.`);

if (!dryRun && moved > 0) {
  console.log("\nRun 'npm run post-ingest' to rebuild indexes, embeddings, and learning flags.");
}
