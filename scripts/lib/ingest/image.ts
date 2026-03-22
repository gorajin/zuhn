import { join, basename, extname } from "node:path";
import { mkdir, copyFile, writeFile } from "node:fs/promises";
import matter from "gray-matter";
import { generateSourceId } from "../generate-id";

export interface ImageResult {
  sourceId: string;
  sourcePath: string;
  rawPath: string;
}

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".heic", ".webp", ".gif", ".svg", ".tiff"];

function slugFromPath(input: string): string {
  const base = basename(input);
  const ext = extname(base);
  return base.slice(0, base.length - ext.length);
}

/**
 * Ingest an image from a local file path.
 * - Validates file has a supported image extension
 * - Copies to sources/image/raw/{slug}.{ext}
 * - Creates a source .md file with frontmatter via gray-matter
 */
export async function ingestImage(
  filePath: string,
  kbRoot?: string,
): Promise<ImageResult> {
  const root = kbRoot ?? join(__dirname, "../../..", "knowledge-base");
  const rawDir = join(root, "sources", "image", "raw");
  const sourceDir = join(root, "sources", "image");

  // Validate extension
  const ext = extname(filePath).toLowerCase();
  if (!IMAGE_EXTENSIONS.includes(ext)) {
    throw new Error(`Unsupported image format: ${ext}`);
  }

  await mkdir(rawDir, { recursive: true });
  await mkdir(sourceDir, { recursive: true });

  const slug = slugFromPath(filePath);
  const rawPath = join(rawDir, `${slug}${ext}`);

  // Copy local file
  await copyFile(filePath, rawPath);

  // Generate source ID and metadata
  const sourceId = generateSourceId(slug);
  const today = new Date().toISOString().slice(0, 10);

  // Build source .md with frontmatter via gray-matter
  const sourceData: Record<string, string | number> = {
    id: sourceId,
    type: "image",
    title: slug,
    date_ingested: today,
    insight_count: 0,
  };

  const body = `<!-- Image source: ${slug}${ext} -->\n<!-- Use Read tool to view the image, then create extraction JSON -->\n`;
  const sourceMd = matter.stringify(body, sourceData);

  const sourcePath = join(sourceDir, `${slug}.md`);
  await writeFile(sourcePath, sourceMd, "utf-8");

  return { sourceId, sourcePath, rawPath };
}
