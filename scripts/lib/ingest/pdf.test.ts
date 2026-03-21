import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import matter from "gray-matter";
import { ingestPdf } from "./pdf";

describe("ingestPdf", () => {
  let tempDir: string;
  let kbRoot: string;
  let fakePdfPath: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "pdf-test-"));
    kbRoot = join(tempDir, "knowledge-base");
    // Create a fake PDF file (just needs to exist; we don't parse PDF content)
    fakePdfPath = join(tempDir, "test-document.pdf");
    await writeFile(fakePdfPath, "%PDF-1.4 fake content for testing");
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("copies local PDF to sources/pdf/raw/", async () => {
    const result = await ingestPdf(fakePdfPath, kbRoot);
    const rawStat = await stat(result.rawPath);
    expect(rawStat.isFile()).toBe(true);
    expect(result.rawPath).toContain("sources/pdf/raw/");
    expect(result.rawPath).toMatch(/\.pdf$/);
  });

  it("creates source .md with valid frontmatter", async () => {
    const result = await ingestPdf(fakePdfPath, kbRoot);
    const mdContent = await readFile(result.sourcePath, "utf-8");
    const parsed = matter(mdContent);
    expect(parsed.data.id).toMatch(/^SRC-/);
    expect(parsed.data.type).toBe("pdf");
    expect(parsed.data.title).toBe("test-document");
    expect(parsed.data.date_ingested).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns sourceId matching SRC- pattern", async () => {
    const result = await ingestPdf(fakePdfPath, kbRoot);
    expect(result.sourceId).toMatch(/^SRC-\d{6}-[A-F0-9]{4}$/);
  });

  it("returns correct sourcePath and rawPath", async () => {
    const result = await ingestPdf(fakePdfPath, kbRoot);
    expect(result.sourcePath).toContain("sources/pdf/");
    expect(result.sourcePath).toMatch(/\.md$/);
    expect(result.rawPath).toContain("sources/pdf/raw/");
    expect(result.rawPath).toMatch(/\.pdf$/);
  });
});
