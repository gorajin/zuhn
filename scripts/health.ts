#!/usr/bin/env npx tsx

import { join } from "node:path";
import fg from "fast-glob";
import { parseMarkdownFile } from "./lib/parse-insight.js";
import {
  InsightFrontmatter,
  SourceFrontmatter,
  PrincipleFrontmatter,
  MentalModelFrontmatter,
} from "./schemas/frontmatter.js";
import type { z } from "zod";

const KB_ROOT = join(__dirname, "../knowledge-base");

// ─── Types ────────────────────────────────────────────────────────────

interface ValidationResult {
  errors: string[];
  warnings: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────

async function validateFiles(
  pattern: string,
  ignore: string[],
  schema: z.ZodTypeAny,
  label: string
): Promise<ValidationResult> {
  const result: ValidationResult = { errors: [], warnings: [] };

  const files = await fg(pattern, {
    cwd: KB_ROOT,
    absolute: true,
    ignore,
  });

  if (files.length === 0) {
    console.log(`  ${label}: 0 files found (OK)`);
    return result;
  }

  const seenIds = new Map<string, string>();

  for (const filePath of files) {
    const relPath = filePath.replace(KB_ROOT + "/", "");
    let parsed;
    try {
      parsed = await parseMarkdownFile(filePath);
    } catch (err) {
      result.errors.push(`${relPath}: failed to parse file — ${err}`);
      continue;
    }

    // Validate against schema
    const validation = schema.safeParse(parsed.data);
    if (!validation.success) {
      for (const issue of validation.error.issues) {
        const field = issue.path.join(".");
        result.errors.push(`${relPath}: ${field} — ${issue.message}`);
      }
      continue;
    }

    const data = validation.data as Record<string, unknown>;

    // Duplicate ID check
    const id = data.id as string | undefined;
    if (id) {
      if (seenIds.has(id)) {
        result.errors.push(
          `${relPath}: duplicate id "${id}" (also in ${seenIds.get(id)})`
        );
      } else {
        seenIds.set(id, relPath);
      }
    }

    // Warnings for unindexed / unembedded (insights only)
    if ("indexed" in data && data.indexed === false) {
      result.warnings.push(`${relPath}: indexed is false`);
    }
    if ("embedded" in data && data.embedded === false) {
      result.warnings.push(`${relPath}: embedded is false`);
    }
  }

  console.log(
    `  ${label}: ${files.length} files, ${result.errors.length} errors, ${result.warnings.length} warnings`
  );
  return result;
}

// ─── Main ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("=== health.ts ===");
  console.log(`Checking: ${KB_ROOT}\n`);

  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // 1. Validate insight files
  const insightResult = await validateFiles(
    "domains/**/*.md",
    ["**/_overview.md", "**/_summary.md"],
    InsightFrontmatter,
    "Insights"
  );
  allErrors.push(...insightResult.errors);
  allWarnings.push(...insightResult.warnings);

  // 2. Validate principle files
  const principleResult = await validateFiles(
    "principles/**/*.md",
    ["**/_index.md"],
    PrincipleFrontmatter,
    "Principles"
  );
  allErrors.push(...principleResult.errors);
  allWarnings.push(...principleResult.warnings);

  // 3. Validate mental model files
  const mentalModelResult = await validateFiles(
    "mental-models/**/*.md",
    ["**/_index.md"],
    MentalModelFrontmatter,
    "Mental Models"
  );
  allErrors.push(...mentalModelResult.errors);
  allWarnings.push(...mentalModelResult.warnings);

  // 4. Validate source files
  const sourceResult = await validateFiles(
    "sources/{reddit,paste,youtube,blog,pdf}/*.md",
    ["**/_index.md", "**/raw/**"],
    SourceFrontmatter,
    "Sources"
  );
  allErrors.push(...sourceResult.errors);
  allWarnings.push(...sourceResult.warnings);

  // 5. Referential integrity: check that related[] links point to valid IDs
  {
    // Collect all valid insight and principle IDs
    const validIds = new Set<string>();
    const insightFiles = await fg("domains/**/*.md", {
      cwd: KB_ROOT,
      absolute: true,
      ignore: ["**/_overview.md", "**/_summary.md"],
    });

    interface ParsedInsight {
      id: string;
      related?: string[];
      relPath: string;
    }
    const parsedInsights: ParsedInsight[] = [];

    for (const filePath of insightFiles) {
      const relPath = filePath.replace(KB_ROOT + "/", "");
      try {
        const parsed = await parseMarkdownFile(filePath);
        const validation = InsightFrontmatter.safeParse(parsed.data);
        if (validation.success) {
          validIds.add(validation.data.id);
          parsedInsights.push({
            id: validation.data.id,
            related: validation.data.related,
            relPath,
          });
        }
      } catch {
        // Already reported above
      }
    }

    // Also collect principle IDs so insights can reference them
    const principleFiles = await fg("principles/**/*.md", {
      cwd: KB_ROOT,
      absolute: true,
      ignore: ["**/_index.md"],
    });
    for (const filePath of principleFiles) {
      try {
        const parsed = await parseMarkdownFile(filePath);
        const validation = PrincipleFrontmatter.safeParse(parsed.data);
        if (validation.success) {
          validIds.add(validation.data.id);
        }
      } catch {
        // Already reported above
      }
    }

    for (const ins of parsedInsights) {
      if (ins.related) {
        for (const ref of ins.related) {
          if (!validIds.has(ref)) {
            allErrors.push(
              `${ins.relPath}: related reference "${ref}" does not exist`
            );
          }
        }
      }
    }

    const brokenCount = allErrors.length - (
      insightResult.errors.length +
      principleResult.errors.length +
      mentalModelResult.errors.length +
      sourceResult.errors.length
    );
    if (brokenCount > 0) {
      console.log(`  Referential integrity: ${brokenCount} broken related[] links`);
    } else {
      console.log(`  Referential integrity: OK`);
    }
  }

  // Report
  console.log("");

  if (allWarnings.length > 0) {
    console.log(`Warnings (${allWarnings.length}):`);
    for (const w of allWarnings) {
      console.warn(`  WARN: ${w}`);
    }
    console.log("");
  }

  if (allErrors.length > 0) {
    console.log(`Errors (${allErrors.length}):`);
    for (const e of allErrors) {
      console.error(`  ERROR: ${e}`);
    }
    console.log("");
    console.error("Health check FAILED.");
    process.exit(1);
  }

  console.log("Health check PASSED.");
}

main().catch((err) => {
  console.error("health.ts failed:", err);
  process.exit(1);
});
