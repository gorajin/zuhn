import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { extractArticle } from "./blog";

const FIXTURE_PATH = join(__dirname, "../../../tests/fixtures/ingest/sample-article.html");

describe("extractArticle", () => {
  it("extracts article text content", async () => {
    const html = await readFile(FIXTURE_PATH, "utf-8");
    const result = extractArticle(html, "https://techblog.com/ai-changes-everything");
    expect(result).not.toBeNull();
    expect(result!.text).toContain("artificial intelligence");
    expect(result!.text).toContain("human judgment");
  });

  it("strips navigation and footer", async () => {
    const html = await readFile(FIXTURE_PATH, "utf-8");
    const result = extractArticle(html, "https://techblog.com/ai-changes-everything");
    expect(result!.text).not.toContain("Navigation links");
    expect(result!.text).not.toContain("Footer content");
  });

  it("extracts metadata from OpenGraph tags", async () => {
    const html = await readFile(FIXTURE_PATH, "utf-8");
    const result = extractArticle(html, "https://techblog.com/ai-changes-everything");
    expect(result!.metadata.title).toBe("How AI Changes Everything");
    expect(result!.metadata.siteName).toBe("TechBlog");
    expect(result!.metadata.author).toBe("Jane Doe");
  });

  it("returns word count", async () => {
    const html = await readFile(FIXTURE_PATH, "utf-8");
    const result = extractArticle(html, "https://techblog.com/ai-changes-everything");
    expect(result!.wordCount).toBeGreaterThan(20);
  });

  it("returns null for empty/minimal content", () => {
    const html = "<html><body><p>Short</p></body></html>";
    const result = extractArticle(html, "https://example.com");
    expect(result).toBeNull();
  });
});
