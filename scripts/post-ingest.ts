#!/usr/bin/env npx tsx

import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";

const PROJECT_ROOT = join(__dirname, "..");
const KB_ROOT = join(PROJECT_ROOT, "knowledge-base");
const ACTIVITY_LOG = join(KB_ROOT, "meta", "activity.md");

// ─── Helpers ──────────────────────────────────────────────────────────

function timestamp(): string {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

async function appendToActivityLog(entry: string): Promise<void> {
  await mkdir(join(ACTIVITY_LOG, ".."), { recursive: true });
  let existing = "";
  try {
    existing = await readFile(ACTIVITY_LOG, "utf-8");
  } catch {
    existing = "# Ingestion Activity Log\n";
  }
  const line = `\n- **${timestamp()}** — ${entry}`;
  await writeFile(ACTIVITY_LOG, existing + line + "\n", "utf-8");
}

function runStep(label: string, args: string[]): { ok: boolean; error?: string } {
  console.log(`\n>> ${label}`);
  try {
    execFileSync(args[0], args.slice(1), {
      stdio: "inherit",
      cwd: PROJECT_ROOT,
    });
    console.log(`   OK`);
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`   FAILED: ${msg}`);
    return { ok: false, error: msg };
  }
}

// ─── Main ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("╔══════════════════════════════════════╗");
  console.log("║       Post-Ingest Orchestrator       ║");
  console.log("╚══════════════════════════════════════╝");
  console.log(`Started at: ${timestamp()}`);

  const results: { step: string; status: string }[] = [];

  // Step 1: Health check
  const healthResult = runStep("Health Check", [
    "npx", "tsx", join(PROJECT_ROOT, "scripts", "health.ts"),
  ]);

  if (!healthResult.ok) {
    results.push({ step: "health", status: "FAILED" });
    await appendToActivityLog(
      `post-ingest health check failed (continuing): ${healthResult.error}`
    );
    console.warn("\nHealth check FAILED — continuing to reindex and auto-git.");
  } else {
    results.push({ step: "health", status: "PASSED" });
  }

  // Step 2: Reindex
  const reindexResult = runStep("Reindex", [
    "npx", "tsx", join(PROJECT_ROOT, "scripts", "reindex.ts"),
  ]);

  if (reindexResult.ok) {
    results.push({ step: "reindex", status: "OK" });
  } else {
    results.push({ step: "reindex", status: "FAILED" });
    await appendToActivityLog(
      `post-ingest reindex FAILED — aborting: ${reindexResult.error}`
    );
    console.error("\nPipeline ABORTED: reindex failed (stale indices are worse than no indices).");
    printSummary(results);
    process.exit(1);
  }

  // Step 3: Embed (optional — graceful degradation if Ollama not running)
  const embedResult = runStep("Embed", [
    "npx", "tsx", join(PROJECT_ROOT, "scripts", "embed.ts"),
  ]);

  if (embedResult.ok) {
    results.push({ step: "embed", status: "OK" });
  } else {
    // Embedding failure is non-fatal: FTS5-only mode is fine
    results.push({ step: "embed", status: "SKIPPED" });
    console.warn("\nEmbed step failed (non-fatal) — FTS5-only mode active.");
  }

  // Step 4: Learn (auto-connections, emergence detection, confidence propagation)
  const learnResult = runStep("Learn", [
    "npx", "tsx", join(PROJECT_ROOT, "scripts", "learn.ts"),
  ]);

  if (learnResult.ok) {
    results.push({ step: "learn", status: "OK" });
  } else {
    // Learning failure is non-fatal: insights remain usable without connections
    results.push({ step: "learn", status: "SKIPPED" });
    console.warn("\nLearn step failed (non-fatal) — connections and flags not updated.");
  }

  // Step 5: Auto-git
  let gitStatus = "SKIPPED";
  console.log("\n>> Auto-git");
  try {
    // Stage knowledge-base/
    execFileSync("git", ["add", "knowledge-base/"], {
      stdio: "pipe",
      cwd: PROJECT_ROOT,
    });

    // Check if there are staged changes
    try {
      execFileSync("git", ["diff", "--cached", "--quiet"], {
        stdio: "pipe",
        cwd: PROJECT_ROOT,
      });
      // Exit 0 means no changes
      console.log("   No changes to commit.");
      gitStatus = "NO_CHANGES";
    } catch {
      // Exit non-zero means there ARE staged changes — commit them
      execFileSync(
        "git",
        ["commit", "-m", "auto: post-ingest — updated indices and metadata"],
        { stdio: "pipe", cwd: PROJECT_ROOT }
      );
      console.log("   Committed changes.");
      gitStatus = "COMMITTED";
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`   Git step failed: ${msg}`);
    gitStatus = "FAILED";
  }
  results.push({ step: "auto-git", status: gitStatus });

  // Step 4: Log activity
  const summaryLine = results
    .map((r) => `${r.step}=${r.status}`)
    .join(", ");
  await appendToActivityLog(`post-ingest completed — ${summaryLine}`);

  // Print summary
  printSummary(results);
}

function printSummary(results: { step: string; status: string }[]): void {
  console.log("\n┌──────────────────────────────────────┐");
  console.log("│            Pipeline Summary           │");
  console.log("├──────────────────────────────────────┤");
  for (const r of results) {
    const pad = " ".repeat(Math.max(0, 18 - r.step.length));
    console.log(`│  ${r.step}${pad} ${r.status.padEnd(16)} │`);
  }
  console.log("└──────────────────────────────────────┘");
}

main().catch((err) => {
  console.error("post-ingest.ts failed:", err);
  process.exit(1);
});
