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
    const md = await buildMasterIndex(insights);
    expect(md).toContain("# Knowledge Base Master Index");
    expect(md).toContain("ai-development");
    expect(md).toContain("Total insights: 2");
    // Issue 1: single-line header with Sources count
    expect(md).toContain("Sources:");
    // Issue 1: Principles column in domain table
    expect(md).toContain("Principles");
    // Issue 1: Flags header renamed
    expect(md).toContain("## Flags (for Claude)");
    // Issue 11-14: Recently Added header includes "(last 7 days)"
    expect(md).toContain("## Recently Added (last 7 days)");
  });

  it("includes tag summary in inline format", async () => {
    const insights = await scanInsights(SAMPLE_KB);
    const md = await buildMasterIndex(insights);
    // Issue 11: tags are inline as tag(N) format, not bulleted
    expect(md).toContain("hooks");
    expect(md).toContain("cost-optimization");
    expect(md).not.toMatch(/^- \*\*hooks\*\*/m);
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
