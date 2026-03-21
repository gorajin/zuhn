import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import matter from "gray-matter";
import fg from "fast-glob";
import { generateInsightId } from "../generate-id.js";
import { slugify } from "../ingest/slug.js";
import type { ExtractionInputData } from "../../schemas/extraction.js";
import type { SourceData } from "../../schemas/frontmatter.js";

// ─── Types ────────────────────────────────────────────────────────────

export interface WriteResult {
  created: number;
  files: string[];
  errors: string[];
  newTopics: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────

/**
 * Scans `sources/**\/*.md` under kbRoot for a file whose frontmatter `id`
 * matches the given sourceId. Returns the absolute path and parsed data.
 */
async function findSourceFile(
  sourceId: string,
  kbRoot: string
): Promise<{ path: string; data: SourceData; content: string } | null> {
  const files = await fg("sources/**/*.md", {
    cwd: kbRoot,
    absolute: true,
    ignore: ["**/_index.md", "**/raw/**"],
  });

  for (const filePath of files) {
    const raw = await readFile(filePath, "utf-8");
    const { data, content } = matter(raw);
    if (data.id === sourceId) {
      return { path: filePath, data: data as SourceData, content: content.trim() };
    }
  }

  return null;
}

/**
 * Returns today's date as YYYY-MM-DD.
 */
function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ─── Main ─────────────────────────────────────────────────────────────

export async function writeInsights(
  input: ExtractionInputData,
  sourceId: string,
  kbRoot: string
): Promise<WriteResult> {
  const result: WriteResult = {
    created: 0,
    files: [],
    errors: [],
    newTopics: [],
  };

  // 1. Find source file
  const source = await findSourceFile(sourceId, kbRoot);
  if (!source) {
    result.errors.push(`Source file not found for id: ${sourceId}`);
    return result;
  }

  // Build source reference from source metadata
  const sourceRef: Record<string, string> = {
    type: source.data.type,
    title: source.data.title,
  };
  if (source.data.author) sourceRef.author = source.data.author;
  if (source.data.url) sourceRef.url = source.data.url;

  const today = todayISO();
  const existingTopics = new Set<string>();

  // Collect existing topic directories so we can detect new ones
  const existingDomainDirs = await fg("domains/*/*", {
    cwd: kbRoot,
    onlyDirectories: true,
  });
  for (const dir of existingDomainDirs) {
    // dir looks like "domains/ai-development/automation"
    existingTopics.add(dir);
  }

  // 2. Write each insight
  for (let index = 0; index < input.insights.length; index++) {
    const insight = input.insights[index];

    try {
      const salt = `${sourceId}-${Date.now()}-${index}`;
      const id = generateInsightId(insight.title, salt);
      let slug = slugify(insight.title);

      const topicDir = join(kbRoot, "domains", insight.domain, insight.topic);
      let filePath = join(topicDir, `${slug}.md`);

      // Check slug collision: if file exists, append 4-char hash suffix from ID
      if (existsSync(filePath)) {
        const hashSuffix = id.split("-").pop()!.toLowerCase();
        slug = `${slug}-${hashSuffix}`;
        filePath = join(topicDir, `${slug}.md`);
      }

      // Track new topics
      const topicKey = `domains/${insight.domain}/${insight.topic}`;
      if (!existingTopics.has(topicKey)) {
        result.newTopics.push(`${insight.domain}/${insight.topic}`);
        existingTopics.add(topicKey);
      }

      // Create directories as needed
      await mkdir(topicDir, { recursive: true });

      // Build frontmatter
      const frontmatter: Record<string, unknown> = {
        id,
        domain: insight.domain,
        topic: insight.topic,
        title: insight.title,
        actionability: insight.actionability,
        confidence: insight.confidence,
        shelf_life: insight.shelf_life,
        status: "active",
        tags: insight.tags,
        sources: [sourceRef],
        date_extracted: today,
        last_accessed: null,
        access_count: 0,
        indexed: false,
        embedded: false,
        resolutions: insight.resolutions,
      };

      // Add optional subtopic if present
      if (insight.subtopic) {
        frontmatter.subtopic = insight.subtopic;
      }

      // Write the file using gray-matter's stringify
      const body = insight.resolutions.standard;
      const fileContent = matter.stringify(body, frontmatter);
      await writeFile(filePath, fileContent, "utf-8");

      result.files.push(filePath);
      result.created++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`Insight "${insight.title}": ${msg}`);
    }
  }

  // 3. Update source file with new insight_count and source_summary as body
  try {
    const sourceRaw = await readFile(source.path, "utf-8");
    const { data: sourceData } = matter(sourceRaw);
    sourceData.insight_count =
      (typeof sourceData.insight_count === "number" ? sourceData.insight_count : 0) +
      result.created;

    const updatedContent = matter.stringify(input.source_summary, sourceData);
    await writeFile(source.path, updatedContent, "utf-8");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    result.errors.push(`Failed to update source file: ${msg}`);
  }

  return result;
}
