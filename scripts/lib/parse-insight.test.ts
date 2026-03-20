import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { parseMarkdownFile, parseInsightFile } from "./parse-insight";

const FIXTURES = join(__dirname, "../../tests/fixtures");

describe("parseMarkdownFile", () => {
  it("extracts data.id, data.title, and content from valid file", async () => {
    const result = await parseMarkdownFile(join(FIXTURES, "valid-insight.md"));
    expect(result.data.id).toBe("INS-260319-A7F2");
    expect(result.data.title).toBe("Use hooks to force-activate skills");
    expect(result.content).toContain("Build a UserPromptSubmit hook");
    expect(result.filePath).toContain("valid-insight.md");
  });
});

describe("parseInsightFile", () => {
  it("returns success: true with correct data for valid file", async () => {
    const result = await parseInsightFile(join(FIXTURES, "valid-insight.md"));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("INS-260319-A7F2");
      expect(result.data.domain).toBe("ai-development");
      expect(result.data.tags).toEqual(["hooks", "skills", "automation"]);
      expect(result.content).toContain("Build a UserPromptSubmit hook");
      expect(result.filePath).toContain("valid-insight.md");
    }
  });

  it("returns success: false with errors array for invalid file", async () => {
    const result = await parseInsightFile(join(FIXTURES, "invalid-insight.md"));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toBeInstanceOf(Array);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toHaveProperty("path");
      expect(result.errors[0]).toHaveProperty("message");
      expect(result.filePath).toContain("invalid-insight.md");
    }
  });
});
