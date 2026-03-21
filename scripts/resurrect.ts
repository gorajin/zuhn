#!/usr/bin/env npx tsx

import { join, basename } from "node:path";
import { rename, readFile, writeFile, mkdir } from "node:fs/promises";
import fg from "fast-glob";
import matter from "gray-matter";

const KB_ROOT = join(__dirname, "../knowledge-base");

// ─── Main ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // Parse --id argument
  const idIdx = process.argv.indexOf("--id");
  if (idIdx === -1 || !process.argv[idIdx + 1]) {
    console.error("Usage: npx tsx scripts/resurrect.ts --id INS-XXXXXX-XXXX");
    process.exit(1);
  }
  const targetId = process.argv[idIdx + 1];

  console.log("=== resurrect.ts ===");
  console.log(`Looking for ${targetId} in archive/\n`);

  // 1. Search for the insight in all archive subdirectories
  const archiveFiles = await fg("archive/**/*.md", {
    cwd: KB_ROOT,
    absolute: true,
  });

  let foundPath: string | null = null;

  for (const filePath of archiveFiles) {
    try {
      const raw = await readFile(filePath, "utf-8");
      const { data } = matter(raw);
      if (data.id === targetId) {
        foundPath = filePath;
        break;
      }
    } catch {
      // Skip unreadable files
    }
  }

  if (!foundPath) {
    console.error(`Error: insight ${targetId} not found in archive/`);
    process.exit(1);
  }

  console.log(`Found: ${foundPath.replace(KB_ROOT + "/", "")}`);

  // 2. Read the frontmatter to determine destination
  const raw = await readFile(foundPath, "utf-8");
  const { data, content } = matter(raw);

  const domain = data.domain as string | undefined;
  const topic = data.topic as string | undefined;

  if (!domain || !topic) {
    console.error(
      `Error: insight ${targetId} is missing domain or topic in frontmatter.`
    );
    process.exit(1);
  }

  // 3. Update status back to active
  data.status = "active";
  const updated = matter.stringify(content, data);

  // 4. Move file back to domains/{domain}/{topic}/
  const destDir = join(KB_ROOT, "domains", domain, topic);
  const destPath = join(destDir, basename(foundPath));

  await mkdir(destDir, { recursive: true });

  // Write updated content first, then move
  await writeFile(foundPath, updated, "utf-8");
  await rename(foundPath, destPath);

  console.log(
    `Resurrected: archive/... -> domains/${domain}/${topic}/${basename(foundPath)}`
  );
  console.log(`Status set to: active`);
}

main().catch((err) => {
  console.error("resurrect.ts failed:", err);
  process.exit(1);
});
