#!/usr/bin/env tsx
/**
 * ingest.ts — Universal URL content fetcher
 *
 * Usage: npx tsx scripts/ingest.ts <url-or-path> [--force]
 *
 * Detects content type (YouTube, Reddit, blog, PDF, audio) from the
 * URL or local file path, fetches/extracts the content, creates a
 * source .md file, and prints metadata + clean text to stdout.
 */

import { join } from "node:path";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import fg from "fast-glob";
import matter from "gray-matter";
import { detectType, normalizeUrl } from "./lib/ingest/detect";
import { slugify } from "./lib/ingest/slug";
import { generateSourceId } from "./lib/generate-id";
import { parseMarkdownFile } from "./lib/parse-insight";

// ─── Constants ─────────────────────────────────────────────────────────
const KB_ROOT = join(__dirname, "..", "knowledge-base");
const CONTENT_THRESHOLD = 3000; // words

// ─── CLI arg parsing ───────────────────────────────────────────────────
const args = process.argv.slice(2);
const forceFlag = args.includes("--force");
const positional = args.filter((a) => a !== "--force");

if (positional.length === 0) {
  console.error("Usage: ingest.ts <url-or-path> [--force]");
  process.exit(1);
}

const rawInput = positional[0];

// ─── Helpers ───────────────────────────────────────────────────────────

/** Check if input looks like a URL */
function isUrl(input: string): boolean {
  return input.startsWith("http://") || input.startsWith("https://");
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

/** List existing domain directories. */
async function listDomains(): Promise<string[]> {
  try {
    const domainsDir = join(KB_ROOT, "domains");
    const entries = await readdir(domainsDir, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}

/** Count words in text. */
function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Output content inline or save to .clean.txt if too long. */
async function outputContent(
  text: string,
  slug: string,
  typeDir: string,
): Promise<void> {
  const wc = wordCount(text);
  if (wc > CONTENT_THRESHOLD) {
    const cleanPath = join(typeDir, `${slug}.clean.txt`);
    await writeFile(cleanPath, text, "utf-8");
    console.log(`\nContent: ${cleanPath} (${wc.toLocaleString()} words)`);
  } else {
    console.log(`\n--- Content (${wc.toLocaleString()} words) ---\n`);
    console.log(text);
  }
}

/** Print a key: value metadata line. */
function meta(key: string, value: string | number): void {
  console.log(`  ${key}: ${value}`);
}

// ─── Main ──────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // 1. Normalize URL (or pass through for local paths)
  const isLocalPath = !isUrl(rawInput);
  let url: string;

  if (isLocalPath) {
    url = rawInput;
  } else {
    url = normalizeUrl(rawInput);
  }

  // 2. Check for duplicates (only for URLs, not local paths)
  if (!forceFlag && !isLocalPath) {
    const existingId = await findDuplicate(url);
    if (existingId) {
      console.error(
        `Source already ingested as ${existingId}. Use --force to re-ingest.`,
      );
      process.exit(1);
    }
  }

  // 3. Detect content type
  let type: ReturnType<typeof detectType>;
  try {
    type = detectType(url);
  } catch (err: unknown) {
    // detectType throws for playlists, unsupported file types, etc.
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  // 4. Gather domain list for metadata header
  const domains = await listDomains();

  // 5. Route to handler
  switch (type) {
    case "youtube": {
      const { ingestYouTube } = await import("./lib/ingest/youtube");
      const result = await ingestYouTube(url, KB_ROOT);

      console.log(`SUCCESS: Source created as ${result.sourceId}`);
      console.log();
      meta("Type", "youtube");
      meta("Title", result.metadata.title);
      meta("Channel", result.metadata.channel);
      meta(
        "Duration",
        `${Math.floor(result.metadata.duration / 60)}:${String(Math.floor(result.metadata.duration % 60)).padStart(2, "0")}`,
      );
      meta("Views", result.metadata.viewCount.toLocaleString());
      meta("Upload Date", result.metadata.uploadDate);
      meta("Chapters", result.metadata.chapters.length);
      meta(
        "Transcript type",
        result.metadata.hasManualSubs ? "manual" : "auto",
      );
      meta("Word count", result.wordCount.toLocaleString());
      if (domains.length > 0) {
        meta("Existing domains", domains.join(", "));
      }
      meta("Source file", result.sourcePath);

      await outputContent(
        result.cleanText,
        slugify(result.metadata.title),
        join(KB_ROOT, "sources", "youtube"),
      );
      break;
    }

    case "blog": {
      let html: string;
      try {
        const res = await fetch(url, {
          signal: AbortSignal.timeout(10_000),
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        html = await res.text();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("TimeoutError") || msg.includes("timed out")) {
          console.error("Request timed out. Check URL and try again.");
        } else {
          console.error(`Failed to fetch URL: ${msg}`);
        }
        process.exit(1);
      }

      const { extractArticle } = await import("./lib/ingest/blog");
      const article = extractArticle(html, url);

      if (!article) {
        console.error(
          "Could not extract content. Paste text manually.",
        );
        process.exit(1);
      }

      const slug = slugify(article.metadata.title || "untitled");
      const sourceId = generateSourceId(article.metadata.title || slug);
      const today = new Date().toISOString().slice(0, 10);

      // Build source frontmatter
      const sourceData: Record<string, string | number | null> = {
        id: sourceId,
        type: "blog",
        title: article.metadata.title,
        author: article.metadata.author,
        url,
        date_ingested: today,
        insight_count: 0,
        site_name: article.metadata.siteName,
        publish_date: article.metadata.publishDate,
        word_count: article.wordCount,
      };

      // Remove null fields to keep frontmatter clean
      for (const key of Object.keys(sourceData)) {
        if (sourceData[key] === null) delete sourceData[key];
      }

      const sourceMd = matter.stringify(article.text, sourceData);

      // Write source .md
      const sourceDir = join(KB_ROOT, "sources", "blog");
      await mkdir(sourceDir, { recursive: true });
      const sourcePath = join(sourceDir, `${slug}.md`);
      await writeFile(sourcePath, sourceMd, "utf-8");

      // Save raw HTML
      const rawDir = join(sourceDir, "raw");
      await mkdir(rawDir, { recursive: true });
      await writeFile(join(rawDir, `${slug}.html`), html, "utf-8");

      console.log(`SUCCESS: Source created as ${sourceId}`);
      console.log();
      meta("Type", "blog");
      meta("Title", article.metadata.title);
      if (article.metadata.author) meta("Author", article.metadata.author);
      if (article.metadata.siteName) meta("Site", article.metadata.siteName);
      if (article.metadata.publishDate)
        meta("Published", article.metadata.publishDate);
      meta("Word count", article.wordCount.toLocaleString());
      if (domains.length > 0) {
        meta("Existing domains", domains.join(", "));
      }
      meta("Source file", sourcePath);

      await outputContent(article.text, slug, sourceDir);
      break;
    }

    case "reddit": {
      const { fetchRedditPost } = await import("./lib/ingest/reddit");

      let post;
      try {
        post = await fetchRedditPost(url);
      } catch (err: unknown) {
        console.error(
          err instanceof Error ? err.message : String(err),
        );
        process.exit(1);
      }

      const slug = slugify(post.title || "untitled");
      const sourceId = generateSourceId(post.title || slug);
      const today = new Date().toISOString().slice(0, 10);

      // Build source frontmatter
      const sourceData: Record<string, string | number> = {
        id: sourceId,
        type: "reddit",
        title: post.title,
        author: post.author ? `u/${post.author}` : "unknown",
        url,
        date_ingested: today,
        insight_count: 0,
      };
      if (post.subreddit) sourceData.subreddit = post.subreddit;
      if (post.score) sourceData.score = post.score;
      if (post.numComments) sourceData.num_comments = post.numComments;

      // Build clean text: title + author + selftext + top comments
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
        // Include top comments sorted by score
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

      // Write source .md
      const sourceDir = join(KB_ROOT, "sources", "reddit");
      await mkdir(sourceDir, { recursive: true });
      const sourcePath = join(sourceDir, `${slug}.md`);
      await writeFile(sourcePath, sourceMd, "utf-8");

      // Save raw JSON
      const rawDir = join(sourceDir, "raw");
      await mkdir(rawDir, { recursive: true });
      await writeFile(
        join(rawDir, `${slug}.json`),
        JSON.stringify(post, null, 2),
        "utf-8",
      );

      console.log(`SUCCESS: Source created as ${sourceId}`);
      console.log();
      meta("Type", "reddit");
      meta("Title", post.title);
      meta("Author", `u/${post.author}`);
      if (post.subreddit) meta("Subreddit", post.subreddit);
      meta("Score", post.score.toLocaleString());
      meta("Comments", post.numComments.toLocaleString());
      meta("Word count", wc.toLocaleString());
      if (domains.length > 0) {
        meta("Existing domains", domains.join(", "));
      }
      meta("Source file", sourcePath);

      await outputContent(cleanText, slug, sourceDir);
      break;
    }

    case "pdf": {
      const { ingestPdf } = await import("./lib/ingest/pdf");

      try {
        const result = await ingestPdf(url, KB_ROOT);
        console.log(`SUCCESS: Source created as ${result.sourceId}`);
        console.log();
        console.log(`PDF saved to ${result.rawPath}. Use Read tool to review.`);
        meta("Source file", result.sourcePath);
      } catch (err: unknown) {
        console.error(
          err instanceof Error ? err.message : String(err),
        );
        process.exit(1);
      }
      break;
    }

    case "image": {
      const { ingestImage } = await import("./lib/ingest/image");
      const result = await ingestImage(url, KB_ROOT);
      console.log(`\nSUCCESS: Source created as ${result.sourceId}\n`);
      console.log(`Image saved to: ${result.rawPath}`);
      console.log("Use Read tool to view the image, then create extraction JSON.");
      break;
    }

    case "audio": {
      const { ingestAudio } = await import("./lib/ingest/audio");

      try {
        const result = await ingestAudio(url, KB_ROOT);
        console.log(`SUCCESS: Source created as ${result.sourceId}`);
        console.log();
        meta("Type", "audio");
        meta("Title", result.metadata.title);
        meta("Duration", result.metadata.duration);
        meta("Word count", result.wordCount.toLocaleString());
        if (domains.length > 0) {
          meta("Existing domains", domains.join(", "));
        }
        meta("Source file", result.sourcePath);

        await outputContent(
          result.cleanText,
          slugify(result.metadata.title),
          join(KB_ROOT, "sources", "audio"),
        );
      } catch (err: unknown) {
        console.error(
          err instanceof Error ? err.message : String(err),
        );
        process.exit(1);
      }
      break;
    }
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
