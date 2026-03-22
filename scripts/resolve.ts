#!/usr/bin/env npx tsx

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import matter from "gray-matter";

const PROJECT_ROOT = join(__dirname, "..");
const KB_ROOT = join(PROJECT_ROOT, "knowledge-base");

// ─── Valid transitions ───────────────────────────────────────────────

const PREDICTION_TRANSITIONS: Record<string, string[]> = {
  active: ["confirmed", "falsified"],
};

const DECISION_TRANSITIONS: Record<string, string[]> = {
  pending: ["success", "failure", "mixed"],
};

// ─── Helpers ─────────────────────────────────────────────────────────

function usage(): never {
  console.error("Usage: resolve.ts --id <ID> --status <STATUS> --notes <NOTES> [--post-ingest]");
  console.error("");
  console.error("  --id          PRED-XXXXXX-XXXX or DEC-XXXXXX-XXXX");
  console.error("  --status      Target status:");
  console.error("                  Predictions: confirmed | falsified");
  console.error("                  Decisions:   success | failure | mixed");
  console.error("  --notes       Explanation of what happened (required)");
  console.error("  --post-ingest Run post-ingest pipeline after resolution");
  process.exit(1);
}

function parseArgs(argv: string[]): {
  id: string;
  status: string;
  notes: string;
  postIngest: boolean;
} {
  let id = "";
  let status = "";
  let notes = "";
  let postIngest = false;

  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case "--id":
        id = argv[++i] || "";
        break;
      case "--status":
        status = argv[++i] || "";
        break;
      case "--notes":
        notes = argv[++i] || "";
        break;
      case "--post-ingest":
        postIngest = true;
        break;
      case "--help":
      case "-h":
        usage();
        break;
    }
  }

  if (!id || !status || !notes) usage();
  return { id, status, notes, postIngest };
}

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

interface FoundRecord {
  filePath: string;
  data: Record<string, unknown>;
  content: string;
  type: "prediction" | "decision";
}

function findRecordById(id: string): FoundRecord | null {
  const isPrediction = id.startsWith("PRED-");
  const isDecision = id.startsWith("DEC-");

  if (!isPrediction && !isDecision) return null;

  const dir = isPrediction
    ? join(KB_ROOT, "predictions")
    : join(KB_ROOT, "decisions");

  if (!existsSync(dir)) return null;

  const files = readdirSync(dir).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const filePath = join(dir, file);
    try {
      const raw = readFileSync(filePath, "utf-8");
      const { data, content } = matter(raw);
      if (data.id === id) {
        return {
          filePath,
          data: data as Record<string, unknown>,
          content,
          type: isPrediction ? "prediction" : "decision",
        };
      }
    } catch {
      // Skip malformed files
    }
  }

  return null;
}

// ─── Main ────────────────────────────────────────────────────────────

function main(): void {
  const { id, status, notes, postIngest } = parseArgs(process.argv);

  // 1. Find the record
  const record = findRecordById(id);
  if (!record) {
    console.error(`Error: No prediction or decision found with ID: ${id}`);
    process.exit(1);
  }

  const currentStatus = String(record.data.status);

  // 2. Validate transition
  const transitions =
    record.type === "prediction" ? PREDICTION_TRANSITIONS : DECISION_TRANSITIONS;

  const allowed = transitions[currentStatus];
  if (!allowed) {
    console.error(
      `Error: ${id} has status "${currentStatus}" which cannot be resolved (already resolved?)`
    );
    process.exit(1);
  }

  if (!allowed.includes(status)) {
    console.error(
      `Error: Invalid transition for ${record.type}: "${currentStatus}" → "${status}"`
    );
    console.error(`  Allowed transitions: ${allowed.join(", ")}`);
    process.exit(1);
  }

  // 3. Update frontmatter
  record.data.status = status;
  record.data.resolution_date = todayISO();
  record.data.resolution_notes = notes;

  const updated = matter.stringify(record.content, record.data);
  writeFileSync(record.filePath, updated, "utf-8");

  console.log(`Resolved ${id}:`);
  console.log(`  Status: ${currentStatus} → ${status}`);
  console.log(`  Date: ${record.data.resolution_date}`);
  console.log(`  Notes: ${notes}`);
  console.log(`  File: ${record.filePath}`);

  // 4. Run post-ingest if requested
  if (postIngest) {
    console.log("\nRunning post-ingest pipeline (mechanism 8 will cascade)...");
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
  } else {
    console.log("\nRun 'npm run post-ingest' to trigger confidence cascade (mechanism 8).");
  }
}

main();
