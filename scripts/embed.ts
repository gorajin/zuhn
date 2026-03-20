#!/usr/bin/env npx tsx

import { join } from "node:path";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { initDb } from "./lib/db";
import { scanInsights } from "./lib/generate-index";
import { isOllamaAvailable, embedText } from "./lib/embeddings";
import { initVectorTable, upsertEmbedding } from "./lib/vector-search";

const KB_ROOT = join(__dirname, "../knowledge-base");
const EMBEDDING_MODEL = "nomic-embed-text";

// ─── Helpers ──────────────────────────────────────────────────────────

/**
 * Update the insight's YAML frontmatter to set embedded: true
 * and embedding_model to the model name.
 */
async function markEmbedded(filePath: string, model: string): Promise<void> {
  const raw = await readFile(filePath, "utf-8");
  let updated = raw;

  // Set embedded: true
  if (updated.includes("embedded: false")) {
    updated = updated.replace("embedded: false", "embedded: true");
  }

  // Set or add embedding_model
  // The frontmatter schema doesn't include embedding_model as a field,
  // so we add it after the embedded line if not present
  if (!updated.includes("embedding_model:")) {
    updated = updated.replace(
      "embedded: true",
      `embedded: true\nembedding_model: "${model}"`
    );
  } else {
    // Update existing embedding_model value
    updated = updated.replace(
      /embedding_model:.*$/m,
      `embedding_model: "${model}"`
    );
  }

  if (updated !== raw) {
    await writeFile(filePath, updated, "utf-8");
  }
}

// ─── Main ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("=== embed.ts ===");

  // 1. Check if Ollama is available
  const available = await isOllamaAvailable();
  if (!available) {
    console.log(
      "Ollama is not running. Skipping embedding step (FTS5-only mode)."
    );
    console.log(
      "To enable semantic search, start Ollama and run: npm run embed"
    );
    return;
  }

  console.log("Ollama is available. Using model:", EMBEDDING_MODEL);

  // 2. Open database and initialize vector table
  const db = initDb();
  initVectorTable(db);

  // 3. Scan all insights
  const insights = await scanInsights(KB_ROOT);
  console.log(`Found ${insights.length} insights.`);

  if (insights.length === 0) {
    console.log("No insights to embed.");
    db.close();
    return;
  }

  // 4. Process each insight
  let embedded = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < insights.length; i++) {
    const ins = insights[i];
    const oneLine = ins.data.resolutions.one_line;
    const contentHash = createHash("sha256").update(oneLine).digest("hex");

    // Check if already embedded with same content
    const existing = db
      .prepare(
        "SELECT content_hash, embedding_model FROM insights WHERE id = ?"
      )
      .get(ins.data.id) as
      | { content_hash: string; embedding_model: string | null }
      | undefined;

    if (
      existing &&
      existing.content_hash === contentHash &&
      existing.embedding_model === EMBEDDING_MODEL
    ) {
      // Check if embedding already exists in vec table
      const vecRow = db
        .prepare("SELECT id FROM embeddings WHERE id = ?")
        .get(ins.data.id);

      if (vecRow) {
        skipped++;
        continue;
      }
    }

    // Embed the one_line text
    console.log(
      `Embedding ${i + 1}/${insights.length}: ${ins.data.id} — ${oneLine.slice(0, 60)}...`
    );

    try {
      const embedding = await embedText(oneLine, EMBEDDING_MODEL);

      // Upsert into vec0 table
      upsertEmbedding(db, ins.data.id, embedding);

      // Update embedding_model in insights table
      db.prepare("UPDATE insights SET embedding_model = ? WHERE id = ?").run(
        EMBEDDING_MODEL,
        ins.data.id
      );

      // Mark the YAML frontmatter
      await markEmbedded(ins.filePath, EMBEDDING_MODEL);

      embedded++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  FAILED: ${msg}`);
      failed++;
    }
  }

  db.close();

  // 5. Summary
  console.log("\n--- Embedding Summary ---");
  console.log(`  Embedded: ${embedded}`);
  console.log(`  Skipped (unchanged): ${skipped}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total: ${insights.length}`);
}

main().catch((err) => {
  console.error("embed.ts failed:", err);
  process.exit(1);
});
