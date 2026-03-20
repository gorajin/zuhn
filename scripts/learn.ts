#!/usr/bin/env npx tsx

import { join } from "node:path";
import { initDb } from "./lib/db";
import { initVectorTable } from "./lib/vector-search";
import {
  discoverConnections,
  detectEmergence,
  propagateConfidence,
  writeFlagsFile,
} from "./lib/learning";

const KB_ROOT = join(__dirname, "../knowledge-base");

async function main(): Promise<void> {
  console.log("╔══════════════════════════════════════╗");
  console.log("║         Learning Mechanisms           ║");
  console.log("╚══════════════════════════════════════╝");
  console.log();

  // 1. Open database and load vector extension
  const db = initDb();
  initVectorTable(db);

  try {
    // 2. Mechanism 1: Automatic Connection Discovery
    console.log("── Mechanism 1: Connection Discovery ──");
    const connectionResult = await discoverConnections(db, KB_ROOT);
    console.log(
      `\nUpdated ${connectionResult.totalUpdated} insight(s) with related connections.\n`
    );

    // 3. Mechanism 2: Principle Emergence Detection
    console.log("── Mechanism 2: Emergence Detection ───");
    const flags = await detectEmergence(KB_ROOT);
    if (flags.length > 0) {
      for (const flag of flags) {
        const ratio =
          flag.principleCount === 0
            ? `${flag.insightCount}:0`
            : `${flag.insightCount}:${flag.principleCount}`;
        console.log(
          `  COMPRESS: ${flag.domain}/${flag.topic} — ${flag.insightCount} insights, ${flag.principleCount} principles (${ratio})`
        );
      }
    } else {
      console.log("  No topics flagged for compression.");
    }

    // 4. Write flags file
    await writeFlagsFile(KB_ROOT, flags);
    console.log(`\nWrote ${flags.length} flag(s) to meta/flags.md.\n`);

    // 5. Mechanism 3: Confidence Propagation
    console.log("── Mechanism 3: Confidence Propagation ─");
    const confidenceChanges = await propagateConfidence(db, KB_ROOT);
    if (confidenceChanges.length > 0) {
      console.log(
        `\n${confidenceChanges.length} confidence update(s) applied.\n`
      );
    } else {
      console.log("\nNo confidence changes.\n");
    }

    // 6. Summary
    console.log("┌──────────────────────────────────────┐");
    console.log("│          Learning Summary             │");
    console.log("├──────────────────────────────────────┤");
    console.log(
      `│  Connections updated:  ${String(connectionResult.totalUpdated).padEnd(14)}│`
    );
    console.log(
      `│  Emergence flags:     ${String(flags.length).padEnd(14)}│`
    );
    console.log(
      `│  Confidence changes:  ${String(confidenceChanges.length).padEnd(14)}│`
    );
    console.log("└──────────────────────────────────────┘");
  } finally {
    db.close();
  }
}

main().catch((err) => {
  console.error("learn.ts failed:", err);
  process.exit(1);
});
