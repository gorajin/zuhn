import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import matter from "gray-matter";
import { writeInsights } from "./write-insights";
import { InsightFrontmatter } from "../../schemas/frontmatter";
import type { ExtractionInputData } from "../../schemas/extraction";

// ─── Helpers ──────────────────────────────────────────────────────────

let tempDir: string;

const SOURCE_ID = "SRC-260320-AAAA";

/** Creates a minimal source .md file inside tempDir/sources/youtube/ */
async function createMockSource(overrides: Record<string, unknown> = {}): Promise<string> {
  const sourceDir = join(tempDir, "sources", "youtube");
  await mkdir(sourceDir, { recursive: true });
  const filePath = join(sourceDir, "test-source.md");

  const data: Record<string, unknown> = {
    id: SOURCE_ID,
    type: "youtube",
    title: "Test Source Title",
    author: "Test Author",
    url: "https://example.com/test",
    date_ingested: "2026-03-20",
    insight_count: 0,
    ...overrides,
  };

  const content = matter.stringify("Original source body.", data);
  await writeFile(filePath, content, "utf-8");
  return filePath;
}

function sampleInput(overrides: Partial<ExtractionInputData> = {}): ExtractionInputData {
  return {
    source_summary: "A podcast interview about AI automation honesty.",
    insights: [
      {
        domain: "ai-development",
        topic: "automation",
        title: "Only automate what you deeply understand",
        actionability: "immediate",
        confidence: "high",
        shelf_life: "evergreen",
        tags: ["automation", "understanding", "ai-agents"],
        resolutions: {
          one_line: "Automate only processes you deeply understand.",
          standard: "First build the manual process, then automate.",
        },
      },
    ],
    ...overrides,
  };
}

// ─── Setup / Teardown ─────────────────────────────────────────────────

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "write-insights-test-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

// ─── Tests ────────────────────────────────────────────────────────────

describe("writeInsights", () => {
  it("creates insight files with correct frontmatter", async () => {
    await createMockSource();
    const input = sampleInput();

    const result = await writeInsights(input, SOURCE_ID, tempDir);

    expect(result.created).toBe(1);
    expect(result.files).toHaveLength(1);
    expect(result.errors).toHaveLength(0);

    // Read the created file and validate against schema
    const raw = await readFile(result.files[0], "utf-8");
    const { data, content } = matter(raw);

    expect(data.id).toMatch(/^INS-\d{6}-[0-9A-F]{4}$/);
    expect(data.domain).toBe("ai-development");
    expect(data.topic).toBe("automation");
    expect(data.status).toBe("active");
    expect(data.indexed).toBe(false);
    expect(data.embedded).toBe(false);
    expect(data.access_count).toBe(0);
    expect(data.last_accessed).toBeNull();
    expect(content.trim()).toBe("First build the manual process, then automate.");

    // Validate full frontmatter against Zod schema
    const validation = InsightFrontmatter.safeParse(data);
    expect(validation.success).toBe(true);
  });

  it("populates sources from the source file metadata", async () => {
    await createMockSource();
    const input = sampleInput();

    const result = await writeInsights(input, SOURCE_ID, tempDir);

    const raw = await readFile(result.files[0], "utf-8");
    const { data } = matter(raw);

    expect(data.sources).toHaveLength(1);
    expect(data.sources[0].type).toBe("youtube");
    expect(data.sources[0].title).toBe("Test Source Title");
    expect(data.sources[0].author).toBe("Test Author");
    expect(data.sources[0].url).toBe("https://example.com/test");
  });

  it("creates directories for new domains/topics automatically", async () => {
    await createMockSource();

    const input = sampleInput({
      insights: [
        {
          domain: "brand-new-domain",
          topic: "brand-new-topic",
          title: "A novel insight",
          actionability: "reference",
          confidence: "medium",
          shelf_life: "evergreen",
          tags: ["novel"],
          resolutions: {
            one_line: "Something new.",
            standard: "This is a novel insight in a new domain.",
          },
        },
      ],
    });

    const result = await writeInsights(input, SOURCE_ID, tempDir);

    expect(result.created).toBe(1);
    expect(result.newTopics).toContain("brand-new-domain/brand-new-topic");
    expect(result.files[0]).toContain(
      join("domains", "brand-new-domain", "brand-new-topic", "a-novel-insight.md")
    );
  });

  it("updates source file insight_count and writes source_summary as body", async () => {
    const sourcePath = await createMockSource({ insight_count: 3 });
    const input = sampleInput({
      source_summary: "Updated summary after extraction.",
      insights: [
        {
          domain: "ai-development",
          topic: "testing",
          title: "Insight one",
          actionability: "immediate",
          confidence: "high",
          shelf_life: "evergreen",
          tags: ["test"],
          resolutions: {
            one_line: "One.",
            standard: "Standard one.",
          },
        },
        {
          domain: "ai-development",
          topic: "testing",
          title: "Insight two",
          actionability: "reference",
          confidence: "medium",
          shelf_life: "evergreen",
          tags: ["test"],
          resolutions: {
            one_line: "Two.",
            standard: "Standard two.",
          },
        },
      ],
    });

    const result = await writeInsights(input, SOURCE_ID, tempDir);

    expect(result.created).toBe(2);

    // Check source file was updated
    const sourceRaw = await readFile(sourcePath, "utf-8");
    const { data, content } = matter(sourceRaw);

    expect(data.insight_count).toBe(5); // 3 existing + 2 new
    expect(content.trim()).toBe("Updated summary after extraction.");
  });

  it("handles slug collisions by appending hash suffix", async () => {
    await createMockSource();

    // Pre-create a file at the expected slug path to force a collision
    const topicDir = join(tempDir, "domains", "ai-development", "automation");
    await mkdir(topicDir, { recursive: true });
    await writeFile(
      join(topicDir, "only-automate-what-you-deeply-understand.md"),
      "---\nid: INS-260320-XXXX\n---\nExisting file.\n",
      "utf-8"
    );

    const input = sampleInput();
    const result = await writeInsights(input, SOURCE_ID, tempDir);

    expect(result.created).toBe(1);
    // The file should NOT be at the original slug (that one already exists)
    expect(result.files[0]).not.toBe(
      join(topicDir, "only-automate-what-you-deeply-understand.md")
    );
    // The file should have a hash suffix appended
    expect(result.files[0]).toMatch(/only-automate-what-you-deeply-understand-[0-9a-f]{4}\.md$/);
  });

  it("handles multiple insights from the fixture file", async () => {
    await createMockSource();

    // Use the exact sample-extraction.json fixture data
    const input: ExtractionInputData = {
      source_summary: "A podcast interview about AI automation honesty.",
      insights: [
        {
          domain: "ai-development",
          topic: "automation",
          title: "Only automate what you deeply understand",
          actionability: "immediate",
          confidence: "high",
          shelf_life: "evergreen",
          tags: ["automation", "understanding", "ai-agents"],
          resolutions: {
            one_line:
              "Automate only processes you deeply understand — automating ignorance scales mistakes.",
            standard:
              "Max warns that automating what you don't understand just makes failures faster and harder to debug. First build the manual process, then automate.",
          },
        },
        {
          domain: "startups",
          topic: "hiring",
          title: "Convert customers into employees",
          actionability: "reference",
          confidence: "medium",
          shelf_life: "evergreen",
          tags: ["hiring", "customers", "culture-fit"],
          resolutions: {
            one_line:
              "Your best hires are users who already love and understand your product.",
            standard:
              "Gumloop converts power users into team members. They already know the product, believe in the mission, and require less onboarding.",
          },
        },
      ],
    };

    const result = await writeInsights(input, SOURCE_ID, tempDir);

    expect(result.created).toBe(2);
    expect(result.files).toHaveLength(2);
    expect(result.errors).toHaveLength(0);

    // Validate all created files against schema
    for (const filePath of result.files) {
      const raw = await readFile(filePath, "utf-8");
      const { data } = matter(raw);
      const validation = InsightFrontmatter.safeParse(data);
      expect(validation.success).toBe(true);
    }
  });

  it("returns error when source file is not found", async () => {
    // Don't create a source file — should fail gracefully
    const input = sampleInput();
    const result = await writeInsights(input, "SRC-999999-ZZZZ", tempDir);

    expect(result.created).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("Source file not found");
  });

  it("generates unique IDs for each insight", async () => {
    await createMockSource();

    const input = sampleInput({
      insights: [
        {
          domain: "ai-development",
          topic: "testing",
          title: "Same title for uniqueness test",
          actionability: "immediate",
          confidence: "high",
          shelf_life: "evergreen",
          tags: ["test"],
          resolutions: {
            one_line: "First.",
            standard: "First insight.",
          },
        },
        {
          domain: "ai-development",
          topic: "testing",
          title: "Same title for uniqueness test",
          actionability: "reference",
          confidence: "medium",
          shelf_life: "evergreen",
          tags: ["test"],
          resolutions: {
            one_line: "Second.",
            standard: "Second insight.",
          },
        },
      ],
    });

    const result = await writeInsights(input, SOURCE_ID, tempDir);

    expect(result.created).toBe(2);

    // Read both files and check they have different IDs
    const ids = new Set<string>();
    for (const filePath of result.files) {
      const raw = await readFile(filePath, "utf-8");
      const { data } = matter(raw);
      ids.add(data.id as string);
    }
    expect(ids.size).toBe(2);
  });
});
