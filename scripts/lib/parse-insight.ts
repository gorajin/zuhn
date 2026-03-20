import { readFile } from "node:fs/promises";
import matter from "gray-matter";
import { InsightFrontmatter, type InsightData } from "../schemas/frontmatter";

// ─── Interfaces ──────────────────────────────────────────────────────

export interface ParsedFile {
  data: Record<string, unknown>;
  content: string;
  filePath: string;
}

export interface ParseSuccess {
  success: true;
  data: InsightData;
  content: string;
  filePath: string;
}

export interface ParseFailure {
  success: false;
  errors: { path: (string | number)[]; message: string }[];
  filePath: string;
}

export type ParseResult = ParseSuccess | ParseFailure;

// ─── Functions ───────────────────────────────────────────────────────

/**
 * Reads a markdown file, parses YAML frontmatter via gray-matter,
 * and returns the raw data, content, and file path.
 */
export async function parseMarkdownFile(filePath: string): Promise<ParsedFile> {
  const raw = await readFile(filePath, "utf-8");
  const { data, content } = matter(raw);
  return { data, content: content.trim(), filePath };
}

/**
 * Reads a markdown file, parses frontmatter, and validates the data
 * against the InsightFrontmatter Zod schema.
 */
export async function parseInsightFile(filePath: string): Promise<ParseResult> {
  const { data, content } = await parseMarkdownFile(filePath);
  const result = InsightFrontmatter.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data, content, filePath };
  }

  const errors = result.error.issues.map((issue) => ({
    path: issue.path,
    message: issue.message,
  }));

  return { success: false, errors, filePath };
}
