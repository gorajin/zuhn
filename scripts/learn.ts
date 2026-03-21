#!/usr/bin/env npx tsx

import { join } from "node:path";
import { initDb } from "./lib/db";
import { initVectorTable } from "./lib/vector-search";
import {
  discoverConnections,
  detectEmergence,
  propagateConfidence,
  discoverClusters,
  detectGaps,
  detectTransfers,
  detectTensions,
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
    const compressFlags = await detectEmergence(KB_ROOT);
    if (compressFlags.length > 0) {
      for (const flag of compressFlags) {
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

    // 4. Mechanism 3: Confidence Propagation
    console.log("\n── Mechanism 3: Confidence Propagation ─");
    const confidenceChanges = await propagateConfidence(db, KB_ROOT);
    if (confidenceChanges.length > 0) {
      console.log(
        `\n${confidenceChanges.length} confidence update(s) applied.\n`
      );
    } else {
      console.log("\nNo confidence changes.\n");
    }

    // 5. Mechanism 4: Cluster Discovery
    console.log("── Mechanism 4: Cluster Discovery ─────");
    const clusterFlags = await discoverClusters(db, KB_ROOT);
    if (clusterFlags.length > 0) {
      for (const flag of clusterFlags) {
        console.log(
          `  CLUSTER: ${flag.insightIds.length} insights across ${flag.topics.join(", ")}`
        );
      }
    } else {
      console.log("  No cross-topic clusters found.");
    }
    console.log();

    // 6. Mechanism 5: Gap Detection
    console.log("── Mechanism 5: Gap Detection ─────────");
    const gapFlags = await detectGaps(db, KB_ROOT);
    if (gapFlags.length > 0) {
      for (const flag of gapFlags) {
        console.log(
          `  GAP: ${flag.topicA} (${flag.countA}) vs ${flag.topicB} (${flag.countB})`
        );
      }
    } else {
      console.log("  No knowledge gaps detected.");
    }
    console.log();

    // 7. Mechanism 6: Transfer Detection
    console.log("── Mechanism 6: Transfer Detection ────");
    const transferFlags = await detectTransfers(db, KB_ROOT);
    if (transferFlags.length > 0) {
      for (const flag of transferFlags) {
        console.log(
          `  TRANSFER: "${flag.principleTitle}" (${flag.principleDomain}) -> ${flag.targetDomain}/${flag.targetTopic} (sim: ${flag.similarity.toFixed(2)})`
        );
      }
    } else {
      console.log("  No cross-domain transfers detected.");
    }
    console.log();

    // 8. Mechanism 7: Tension Detection
    console.log("── Mechanism 7: Tension Detection ─────");
    const tensionResult = await detectTensions(db, KB_ROOT);
    if (tensionResult.newTensions > 0) {
      console.log(
        `\n${tensionResult.newTensions} new tension(s) created.\n`
      );
    } else {
      console.log("  No new tensions detected.\n");
    }

    // 9. Write flags file with all sections
    const allFlags = {
      compress: compressFlags,
      discover: clusterFlags,
      gaps: gapFlags,
      transfers: transferFlags,
    };
    await writeFlagsFile(KB_ROOT, allFlags);
    const totalFlags =
      compressFlags.length +
      clusterFlags.length +
      gapFlags.length +
      transferFlags.length;
    console.log(`Wrote ${totalFlags} flag(s) to meta/flags.md.\n`);

    // 10. Summary
    console.log("┌──────────────────────────────────────┐");
    console.log("│          Learning Summary             │");
    console.log("├──────────────────────────────────────┤");
    console.log(
      `│  Connections updated:  ${String(connectionResult.totalUpdated).padEnd(14)}│`
    );
    console.log(
      `│  Emergence flags:     ${String(compressFlags.length).padEnd(14)}│`
    );
    console.log(
      `│  Confidence changes:  ${String(confidenceChanges.length).padEnd(14)}│`
    );
    console.log(
      `│  Cluster flags:       ${String(clusterFlags.length).padEnd(14)}│`
    );
    console.log(
      `│  Gap flags:           ${String(gapFlags.length).padEnd(14)}│`
    );
    console.log(
      `│  Transfer flags:      ${String(transferFlags.length).padEnd(14)}│`
    );
    console.log(
      `│  Tensions created:    ${String(tensionResult.newTensions).padEnd(14)}│`
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
