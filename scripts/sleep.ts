#!/usr/bin/env npx tsx

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { SessionState } from "./schemas/session.js";

const PROJECT_ROOT = join(__dirname, "..");
const KB_ROOT = join(PROJECT_ROOT, "knowledge-base");
const SESSION_PATH = join(KB_ROOT, "meta", "session.md");

// ─── Helpers ──────────────────────────────────────────────────────────

function usage(): never {
  console.error("Usage: sleep.ts --file <JSON_FILE>");
  console.error("");
  console.error("  --file    Path to session state JSON file");
  process.exit(1);
}

function parseArgs(argv: string[]): { file: string } {
  let file = "";

  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case "--file":
        file = argv[++i] || "";
        break;
    }
  }

  if (!file) usage();
  return { file };
}

// ─── Main ─────────────────────────────────────────────────────────────

function main(): void {
  const { file } = parseArgs(process.argv);

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
        "Error: Malformed JSON — likely truncated. Ensure the full session state was written."
      );
    } else {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Error: JSON parse failed — ${msg}`);
    }
    process.exit(1);
  }

  // 4. Validate against schema
  const validation = SessionState.safeParse(parsed);
  if (!validation.success) {
    console.error("Error: Session state JSON failed schema validation:");
    for (const issue of validation.error.issues) {
      const field = issue.path.join(".");
      console.error(`  ${field}: ${issue.message}`);
    }
    process.exit(1);
  }

  const state = validation.data;

  // 5. Render to markdown
  const activeFiles = state.active_files.map((f) => `- ${f}`).join("\n");
  const openLoops = state.open_loops.map((l) => `- ${l}`).join("\n");
  const nextActions = state.next_actions.map((a) => `- [ ] ${a}`).join("\n");

  const md = `# Session State
Saved: ${new Date().toISOString()}

## Focus Area
${state.focus_area}

## Train of Thought
${state.train_of_thought}

## Active Files
${activeFiles}

## Open Loops
${openLoops}

## Next Actions
${nextActions}
`;

  // 6. Write to session.md
  mkdirSync(join(KB_ROOT, "meta"), { recursive: true });
  writeFileSync(SESSION_PATH, md, "utf-8");

  // 7. Auto-commit
  try {
    execFileSync("git", ["add", SESSION_PATH], {
      stdio: "pipe",
      cwd: PROJECT_ROOT,
    });

    try {
      execFileSync("git", ["diff", "--cached", "--quiet"], {
        stdio: "pipe",
        cwd: PROJECT_ROOT,
      });
      // No changes
    } catch {
      // There are staged changes — commit
      execFileSync(
        "git",
        ["commit", "-m", "chore: sleep state saved"],
        { stdio: "pipe", cwd: PROJECT_ROOT }
      );
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Git commit failed: ${msg}`);
    process.exit(1);
  }

  console.log("Sleep state saved to meta/session.md and committed.");
}

main();
