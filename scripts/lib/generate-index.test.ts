import { describe, it, expect } from "vitest";
import { join } from "node:path";
import {
  scanInsights,
  buildMasterIndex,
  buildDomainOverview,
  buildTopicSummary,
  buildTagIndex,
} from "./generate-index";

const SAMPLE_KB = join(__dirname, "../../tests/fixtures/sample-kb");

describe("scanInsights", () => {
  it("finds all insight files in a knowledge base", async () => {
    const insights = await scanInsights(SAMPLE_KB);
    expect(insights.length).toBe(2);
  });

  it("parses frontmatter from found files", async () => {
    const insights = await scanInsights(SAMPLE_KB);
    const domains = insights.map((i) => i.data.domain);
    expect(domains).toContain("ai-development");
  });
});

describe("buildMasterIndex", () => {
  it("generates markdown with domain table and correct totals", async () => {
    const insights = await scanInsights(SAMPLE_KB);
    const md = buildMasterIndex(insights);
    expect(md).toContain("# Knowledge Base Master Index");
    expect(md).toContain("ai-development");
    expect(md).toContain("Total insights: 2");
  });

  it("includes tag summary", async () => {
    const insights = await scanInsights(SAMPLE_KB);
    const md = buildMasterIndex(insights);
    expect(md).toContain("hooks");
    expect(md).toContain("cost-optimization");
  });
});

describe("buildDomainOverview", () => {
  it("lists all topics in a domain", async () => {
    const insights = await scanInsights(SAMPLE_KB);
    const aiInsights = insights.filter(
      (i) => i.data.domain === "ai-development"
    );
    const md = buildDomainOverview("ai-development", aiInsights);
    expect(md).toContain("claude-code");
    expect(md).toContain("llm-costs");
  });
});

describe("buildTopicSummary", () => {
  it("lists insight one-liners for a topic", async () => {
    const insights = await scanInsights(SAMPLE_KB);
    const topicInsights = insights.filter(
      (i) => i.data.topic === "claude-code"
    );
    const md = buildTopicSummary("claude-code", topicInsights);
    expect(md).toContain("Force-activate skills via hooks");
    expect(md).toContain("INS-260319-A7F2");
  });
});

describe("buildTagIndex", () => {
  it("generates tag entries with insight references", async () => {
    const insights = await scanInsights(SAMPLE_KB);
    const tags = buildTagIndex(insights);
    expect(tags.has("hooks")).toBe(true);
    expect(tags.get("hooks")).toContain("INS-260319-A7F2");
  });

  it("groups insights that share a tag correctly", async () => {
    const insights = await scanInsights(SAMPLE_KB);
    const tags = buildTagIndex(insights);
    expect(tags.get("hooks")).not.toContain("INS-260319-C3D4");
    expect(tags.get("cost-optimization")).toContain("INS-260319-C3D4");
  });
});
