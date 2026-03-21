import { join, basename, extname } from "node:path";
import { mkdir, copyFile, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import matter from "gray-matter";
import { generateSourceId } from "../generate-id";

export interface PdfResult {
  sourceId: string;
  sourcePath: string;
  rawPath: string;
}

function slugFromPath(input: string): string {
  const base = basename(input);
  const ext = extname(base);
  return base.slice(0, base.length - ext.length);
}

function isUrl(input: string): boolean {
  return input.startsWith("http://") || input.startsWith("https://");
}

/**
 * Ingest a PDF from a URL or local file path.
 * - URLs are downloaded via fetch + stream pipeline
 * - Local files are copied
 * - A source .md file is created with frontmatter via gray-matter
 */
export async function ingestPdf(
  input: string,
  kbRoot?: string,
): Promise<PdfResult> {
  const root = kbRoot ?? join(__dirname, "../../..", "knowledge-base");
  const rawDir = join(root, "sources", "pdf", "raw");
  const sourceDir = join(root, "sources", "pdf");

  await mkdir(rawDir, { recursive: true });
  await mkdir(sourceDir, { recursive: true });

  const slug = isUrl(input) ? slugFromUrl(input) : slugFromPath(input);
  const rawPath = join(rawDir, `${slug}.pdf`);

  if (isUrl(input)) {
    // Download via fetch + stream pipeline
    const res = await fetch(input);
    if (!res.ok) {
      throw new Error(`Failed to download PDF: ${res.status} ${res.statusText}`);
    }
    if (!res.body) {
      throw new Error("Response body is null");
    }
    const nodeStream = Readable.fromWeb(res.body as import("node:stream/web").ReadableStream);
    await pipeline(nodeStream, createWriteStream(rawPath));
  } else {
    // Copy local file
    await copyFile(input, rawPath);
  }

  // Generate source ID and metadata
  const sourceId = generateSourceId(slug);
  const today = new Date().toISOString().slice(0, 10);

  // Build source .md with frontmatter via gray-matter
  // Only include url field for remote sources — gray-matter cannot serialize undefined
  const sourceData: Record<string, string | number> = {
    id: sourceId,
    type: "pdf",
    title: slug,
    date_ingested: today,
    insight_count: 0,
  };
  if (isUrl(input)) {
    sourceData.url = input;
  }

  const body = `<!-- PDF source: ${slug}.pdf -->\n<!-- Extract text and add insights below -->\n`;
  const sourceMd = matter.stringify(body, sourceData);

  const sourcePath = join(sourceDir, `${slug}.md`);
  await writeFile(sourcePath, sourceMd, "utf-8");

  return { sourceId, sourcePath, rawPath };
}

function slugFromUrl(url: string): string {
  const parsed = new URL(url);
  const pathParts = parsed.pathname.split("/").filter(Boolean);
  const last = pathParts[pathParts.length - 1] ?? "download";
  const ext = extname(last);
  return ext ? last.slice(0, last.length - ext.length) : last;
}
