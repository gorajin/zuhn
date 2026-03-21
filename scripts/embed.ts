#!/usr/bin/env npx tsx

import { join } from "node:path";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import fg from "fast-glob";
import matter from "gray-matter";
import { initDb } from "./lib/db";
import { scanInsights } from "./lib/generate-index";
import { isOllamaAvailable, embedText } from "./lib/embeddings";
import { initVectorTable, upsertEmbedding } from "./lib/vector-search";
import { PrincipleFrontmatter, type PrincipleData } from "./schemas/frontmatter";

const KB_ROOT = join(__dirname, "../knowledge-base");
const EMBEDDING_MODEL = "nomic-embed-text";

// ─── Types ───────────────────────────────────────────────────────────

interface PrincipleFile {
  filePath: string;
  data: PrincipleData;
}

// ─── Helpers ──────────────────────────────────────────────────────────

/**
 * Scan `principles/**\/*.md` under kbRoot, ignoring `_index.md`.
 * Parse each file's frontmatter with PrincipleFrontmatter.
 */
async function scanPrinciples(kbRoot: string): Promise<PrincipleFile[]> {
  const pattern = "principles/**/*.md";
  const ignore = ["**/_index.md"];

  const files = await fg(pattern, {
    cwd: kbRoot,
    absolute: true,
    ignore,
  });

  const results: PrincipleFile[] = [];

  for (const filePath of files) {
    try {
      const raw = await readFile(filePath, "utf-8");
      const { data } = matter(raw);
      const parsed = PrincipleFrontmatter.parse(data);
      results.push({ filePath, data: parsed });
    } catch {
      // Skip files that don't parse as valid principles
    }
  }

  return results;
}

/**
 * Update YAML frontmatter to set embedded: true and embedding_model.
 * Works for both insights (which have embedded: false) and principles
 * (which may not have the embedded field at all).
 */
async function markEmbedded(filePath: string, model: string): Promise<void> {
  const raw = await readFile(filePath, "utf-8");
  let updated = raw;

  if (updated.includes("embedded: false")) {
    // Insight case: replace existing false value
    updated = updated.replace("embedded: false", "embedded: true");
  } else if (!updated.includes("embedded:")) {
    // Principle case: field doesn't exist yet — add before closing ---
    // Find the last --- that closes the frontmatter
    const closingIdx = updated.indexOf("---", updated.indexOf("---") + 3);
    if (closingIdx !== -1) {
      updated =
        updated.slice(0, closingIdx) +
        "embedded: true\n" +
        updated.slice(closingIdx);
    }
  }

  // Set or add embedding_model
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

  // 3. Scan all insights and principles
  const insights = await scanInsights(KB_ROOT);
  const principles = await scanPrinciples(KB_ROOT);
  console.log(`Found ${insights.length} insights, ${principles.length} principles.`);

  // ── 4a. Process each insight ────────────────────────────────────────
  let insEmbedded = 0;
  let insSkipped = 0;
  let insFailed = 0;

  if (insights.length > 0) {
    console.log("\n--- Insights ---");
  }

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
        insSkipped++;
        continue;
      }
    }

    // Embed the one_line text
    console.log(
      `Embedding insight ${i + 1}/${insights.length}: ${ins.data.id} — ${oneLine.slice(0, 60)}...`
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

      insEmbedded++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  FAILED: ${msg}`);
      insFailed++;
    }
  }

  // ── 4b. Process each principle ──────────────────────────────────────
  let priEmbedded = 0;
  let priSkipped = 0;
  let priFailed = 0;

  if (principles.length > 0) {
    console.log("\n--- Principles ---");
  }

  for (let i = 0; i < principles.length; i++) {
    const pri = principles[i];
    const textToEmbed = `${pri.data.title}: ${pri.data.summary}`;
    const contentHash = createHash("sha256")
      .update(textToEmbed)
      .digest("hex");

    // Check if already embedded with same content.
    // Principles don't have a row in the insights table, so we check:
    //   1. The frontmatter has embedded: true (set on previous run)
    //   2. The vec row exists in the embeddings table
    // If the title or summary changed, the user/compress script must
    // reset embedded to false, which triggers re-embedding.
    const raw = await readFile(pri.filePath, "utf-8");
    const alreadyMarked = raw.includes("embedded: true");

    if (alreadyMarked) {
      const vecRow = db
        .prepare("SELECT id FROM embeddings WHERE id = ?")
        .get(pri.data.id);

      if (vecRow) {
        priSkipped++;
        continue;
      }
    }

    // Embed title + summary
    console.log(
      `Embedding principle ${i + 1}/${principles.length}: ${pri.data.id} — ${pri.data.title.slice(0, 60)}...`
    );

    try {
      const embedding = await embedText(textToEmbed, EMBEDDING_MODEL);

      // Upsert into the same vec0 table (PRI- prefix avoids collision)
      upsertEmbedding(db, pri.data.id, embedding);

      // Mark the YAML frontmatter
      await markEmbedded(pri.filePath, EMBEDDING_MODEL);

      priEmbedded++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  FAILED: ${msg}`);
      priFailed++;
    }
  }

  db.close();

  // 5. Summary
  const totalEmbedded = insEmbedded + priEmbedded;
  const totalSkipped = insSkipped + priSkipped;
  const totalFailed = insFailed + priFailed;
  const totalItems = insights.length + principles.length;

  console.log("\n--- Embedding Summary ---");
  console.log(`  Insights  — embedded: ${insEmbedded}, skipped: ${insSkipped}, failed: ${insFailed}`);
  console.log(`  Principles — embedded: ${priEmbedded}, skipped: ${priSkipped}, failed: ${priFailed}`);
  console.log(`  Total: ${totalEmbedded} embedded, ${totalSkipped} skipped, ${totalFailed} failed (${totalItems} items)`);
}

main().catch((err) => {
  console.error("embed.ts failed:", err);
  process.exit(1);
});
