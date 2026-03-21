#!/usr/bin/env tsx
/**
 * batch-ingest.ts — Process multiple URLs from a file, one at a time.
 *
 * Usage: npx tsx scripts/batch-ingest.ts <file>
 *
 * Where <file> is a text file with one URL per line.
 * Lines starting with # are treated as comments and skipped.
 * Empty lines are skipped.
 *
 * This script handles the MECHANICAL part (fetching + cleaning) for multiple
 * URLs. The REASONING part (insight extraction) still happens in conversation.
 */

import { join } from "node:path";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import fg from "fast-glob";
import matter from "gray-matter";
import { detectType, normalizeUrl, type ContentType } from "./lib/ingest/detect";
import { slugify } from "./lib/ingest/slug";
import { generateSourceId } from "./lib/generate-id";
import { parseMarkdownFile } from "./lib/parse-insight";

// ─── Constants ─────────────────────────────────────────────────────────
const KB_ROOT = join(__dirname, "..", "knowledge-base");

// ─── Types ─────────────────────────────────────────────────────────────
interface SuccessResult {
  url: string;
  sourceId: string;
  title: string;
  type: ContentType;
  wordCount: number;
}

interface FailureResult {
  url: string;
  error: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────

function isUrl(input: string): boolean {
  return input.startsWith("http://") || input.startsWith("https://");
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Scan source markdown files for a matching url in frontmatter. */
async function findDuplicate(url: string): Promise<string | null> {
  const pattern = "sources/**/*.md";
  const files = await fg(pattern, {
    cwd: KB_ROOT,
    absolute: true,
    ignore: ["**/raw/**", "**/_index.md"],
  });

  for (const file of files) {
    try {
      const { data } = await parseMarkdownFile(file);
      if (data.url === url) {
        return String(data.id);
      }
    } catch {
      // skip unparseable files
    }
  }
  return null;
}

// ─── Per-type ingest functions ─────────────────────────────────────────

async function ingestOne(
  url: string,
): Promise<{ sourceId: string; title: string; type: ContentType; wordCount: number }> {
  const isLocalPath = !isUrl(url);
  const normalized = isLocalPath ? url : normalizeUrl(url);

  // Duplicate check (URLs only)
  if (!isLocalPath) {
    const existingId = await findDuplicate(normalized);
    if (existingId) {
      throw new Error(`Already ingested as ${existingId}. Use single ingest with --force to re-ingest.`);
    }
  }

  const type = detectType(normalized);

  switch (type) {
    case "youtube": {
      const { ingestYouTube } = await import("./lib/ingest/youtube");
      const result = await ingestYouTube(normalized, KB_ROOT);
      return {
        sourceId: result.sourceId,
        title: result.metadata.title,
        type: "youtube",
        wordCount: result.wordCount,
      };
    }

    case "blog": {
      let html: string;
      const res = await fetch(normalized, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      html = await res.text();

      const { extractArticle } = await import("./lib/ingest/blog");
      const article = extractArticle(html, normalized);

      if (!article) {
        throw new Error("Could not extract content");
      }

      const slug = slugify(article.metadata.title || "untitled");
      const sourceId = generateSourceId(article.metadata.title || slug);
      const today = new Date().toISOString().slice(0, 10);

      const sourceData: Record<string, string | number | null> = {
        id: sourceId,
        type: "blog",
        title: article.metadata.title,
        author: article.metadata.author,
        url: normalized,
        date_ingested: today,
        insight_count: 0,
        site_name: article.metadata.siteName,
        publish_date: article.metadata.publishDate,
        word_count: article.wordCount,
      };

      for (const key of Object.keys(sourceData)) {
        if (sourceData[key] === null) delete sourceData[key];
      }

      const sourceMd = matter.stringify(article.text, sourceData);

      const sourceDir = join(KB_ROOT, "sources", "blog");
      await mkdir(sourceDir, { recursive: true });
      const sourcePath = join(sourceDir, `${slug}.md`);
      await writeFile(sourcePath, sourceMd, "utf-8");

      const rawDir = join(sourceDir, "raw");
      await mkdir(rawDir, { recursive: true });
      await writeFile(join(rawDir, `${slug}.html`), html, "utf-8");

      // Save clean text if long
      if (article.wordCount > 3000) {
        const cleanPath = join(sourceDir, `${slug}.clean.txt`);
        await writeFile(cleanPath, article.text, "utf-8");
      }

      return {
        sourceId,
        title: article.metadata.title,
        type: "blog",
        wordCount: article.wordCount,
      };
    }

    case "reddit": {
      const { fetchRedditPost } = await import("./lib/ingest/reddit");
      const post = await fetchRedditPost(normalized);

      const slug = slugify(post.title || "untitled");
      const sourceId = generateSourceId(post.title || slug);
      const today = new Date().toISOString().slice(0, 10);

      const sourceData: Record<string, string | number> = {
        id: sourceId,
        type: "reddit",
        title: post.title,
        author: post.author ? `u/${post.author}` : "unknown",
        url: normalized,
        date_ingested: today,
        insight_count: 0,
      };
      if (post.subreddit) sourceData.subreddit = post.subreddit;
      if (post.score) sourceData.score = post.score;
      if (post.numComments) sourceData.num_comments = post.numComments;

      const lines: string[] = [];
      lines.push(`# ${post.title}`);
      lines.push(`by u/${post.author}${post.subreddit ? ` in ${post.subreddit}` : ""}`);
      lines.push("");
      if (post.body) {
        lines.push(post.body);
        lines.push("");
      }
      if (post.comments.length > 0) {
        lines.push("## Top Comments");
        lines.push("");
        const sorted = [...post.comments].sort((a, b) => b.score - a.score);
        const topComments = sorted.slice(0, 20);
        for (const c of topComments) {
          lines.push(`**u/${c.author}** (${c.score} pts):`);
          lines.push(c.body);
          lines.push("");
        }
      }
      const cleanText = lines.join("\n");
      const wc = wordCount(cleanText);

      const sourceMd = matter.stringify(cleanText, sourceData);

      const sourceDir = join(KB_ROOT, "sources", "reddit");
      await mkdir(sourceDir, { recursive: true });
      const sourcePath = join(sourceDir, `${slug}.md`);
      await writeFile(sourcePath, sourceMd, "utf-8");

      const rawDir = join(sourceDir, "raw");
      await mkdir(rawDir, { recursive: true });
      await writeFile(
        join(rawDir, `${slug}.json`),
        JSON.stringify(post, null, 2),
        "utf-8",
      );

      if (wc > 3000) {
        const cleanPath = join(sourceDir, `${slug}.clean.txt`);
        await writeFile(cleanPath, cleanText, "utf-8");
      }

      return {
        sourceId,
        title: post.title,
        type: "reddit",
        wordCount: wc,
      };
    }

    case "pdf": {
      const { ingestPdf } = await import("./lib/ingest/pdf");
      const result = await ingestPdf(normalized, KB_ROOT);
      return {
        sourceId: result.sourceId,
        title: normalized.split("/").pop() || "PDF",
        type: "pdf",
        wordCount: 0, // PDFs don't have word count at ingest time
      };
    }

    case "audio": {
      const { ingestAudio } = await import("./lib/ingest/audio");
      const result = await ingestAudio(normalized, KB_ROOT);
      return {
        sourceId: result.sourceId,
        title: result.metadata.title,
        type: "audio",
        wordCount: result.wordCount,
      };
    }
  }
}

// ─── Main ──────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Usage: npx tsx scripts/batch-ingest.ts <file>");
    console.error("");
    console.error("Where <file> is a text file with one URL per line.");
    console.error("Lines starting with # are comments. Empty lines are skipped.");
    process.exit(1);
  }

  const filePath = args[0];

  let fileContent: string;
  try {
    fileContent = await readFile(filePath, "utf-8");
  } catch (err: unknown) {
    console.error(`Could not read file: ${filePath}`);
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  // Parse URLs: filter empty lines and comments
  const urls = fileContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  if (urls.length === 0) {
    console.error("No URLs found in file.");
    process.exit(1);
  }

  console.log(`Found ${urls.length} URL(s) to process.\n`);

  const successes: SuccessResult[] = [];
  const failures: FailureResult[] = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const label = `[${i + 1}/${urls.length}]`;

    console.log(`${label} Ingesting: ${url}`);

    try {
      const result = await ingestOne(url);
      successes.push({ url, ...result });
      console.log(
        `${label} OK: ${result.sourceId} — "${result.title}" (${result.wordCount.toLocaleString()} words)\n`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      failures.push({ url, error: msg });
      console.log(`${label} FAILED: ${msg}\n`);
    }
  }

  // ─── Summary ───────────────────────────────────────────────────────
  console.log("");
  console.log(
    "\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557",
  );
  console.log(
    "\u2551         Batch Ingestion Complete      \u2551",
  );
  console.log(
    "\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D",
  );
  console.log("");
  console.log(`Processed: ${urls.length} URLs`);
  console.log(`Succeeded: ${successes.length}`);
  console.log(`Failed:    ${failures.length}`);

  if (successes.length > 0) {
    console.log("");
    console.log("Sources created:");
    for (const s of successes) {
      console.log(
        `- ${s.sourceId}: "${s.title}" (${s.type}, ${s.wordCount.toLocaleString()} words)`,
      );
    }
  }

  if (failures.length > 0) {
    console.log("");
    console.log("Failed:");
    for (const f of failures) {
      console.log(`- ${f.url} \u2014 ${f.error}`);
    }
  }

  console.log("");
  console.log(
    "Clean text saved for each source. Run extraction in conversation to process insights.",
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
