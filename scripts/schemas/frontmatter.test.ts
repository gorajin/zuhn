import { describe, it, expect } from "vitest";
import {
  InsightFrontmatter,
  SourceFrontmatter,
  PrincipleFrontmatter,
  MentalModelFrontmatter,
  TensionFrontmatter,
} from "./frontmatter";

// ─── Helpers ───────────────────────────────────────────────────────────

/** Minimal valid InsightFrontmatter object */
function validInsight() {
  return {
    id: "INS-250315-A1B2",
    domain: "programming",
    topic: "testing",
    title: "Write tests before implementation",
    actionability: "immediate" as const,
    confidence: "high" as const,
    shelf_life: "evergreen" as const,
    status: "active" as const,
    tags: ["tdd", "testing"],
    sources: [{ type: "blog", title: "TDD Guide" }],
    date_extracted: "2025-03-15",
    last_accessed: null,
    access_count: 0,
    indexed: false,
    embedded: false,
    resolutions: {
      one_line: "Always write tests first.",
      standard: "TDD leads to better design and fewer bugs.",
    },
  };
}

/** Minimal valid SourceFrontmatter object */
function validSource() {
  return {
    id: "SRC-250315-FF00",
    type: "blog" as const,
    title: "The Ultimate TDD Guide",
    date_ingested: "2025-03-15",
    insight_count: 3,
  };
}

/** Minimal valid PrincipleFrontmatter object */
function validPrinciple() {
  return {
    id: "PRI-250315-00AA",
    domain: "engineering",
    title: "Test-Driven Development",
    summary: "Write tests before code for better design.",
    confidence: "high" as const,
    supporting_insights: ["INS-250315-A1B2"],
    supporting_count: 1,
    tags: ["tdd"],
    date_created: "2025-03-15",
    last_reviewed: "2025-03-15",
    resolutions: {
      one_line: "Test first, code second.",
      standard: "TDD produces cleaner, more maintainable code.",
    },
  };
}

/** Minimal valid MentalModelFrontmatter object */
function validMentalModel() {
  return {
    id: "MM-250315-BEEF",
    title: "Feedback Loops",
    core_statement: "Tight feedback loops accelerate learning.",
    domains: ["engineering"],
    supporting_principles: ["PRI-250315-00AA"],
    supporting_count: 1,
    confidence: "medium" as const,
    transferable: true,
    date_created: "2025-03-15",
    last_reviewed: "2025-03-15",
    resolutions: {
      one_line: "Faster feedback equals faster learning.",
      standard: "Systems with short feedback loops converge on solutions faster.",
    },
  };
}

/** Minimal valid TensionFrontmatter object */
function validTension() {
  return {
    id: "T-250315-DEAD",
    title: "Speed vs. Quality",
    status: "unresolved" as const,
    side_a: ["INS-250315-A1B2"],
    side_b: ["INS-250315-A1B2"],
  };
}

// ─── InsightFrontmatter ───────────────────────────────────────────────

describe("InsightFrontmatter", () => {
  it("accepts a valid well-formed insight", () => {
    const result = InsightFrontmatter.safeParse(validInsight());
    expect(result.success).toBe(true);
  });

  it("accepts insight with optional fields present", () => {
    const data = {
      ...validInsight(),
      subtopic: "unit-testing",
      related: ["INS-250315-B2C3"],
    };
    const result = InsightFrontmatter.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("accepts insight with optional deep resolution", () => {
    const data = {
      ...validInsight(),
      resolutions: {
        ...validInsight().resolutions,
        deep: "Detailed explanation of TDD benefits and practices.",
      },
    };
    const result = InsightFrontmatter.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("accepts insight with source containing optional author and url", () => {
    const data = {
      ...validInsight(),
      sources: [
        {
          type: "blog",
          title: "TDD Guide",
          author: "Kent Beck",
          url: "https://example.com",
        },
      ],
    };
    const result = InsightFrontmatter.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("accepts last_accessed as a string date", () => {
    const data = { ...validInsight(), last_accessed: "2025-03-20" };
    const result = InsightFrontmatter.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects missing required field (title)", () => {
    const { title, ...rest } = validInsight();
    const result = InsightFrontmatter.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing required field (domain)", () => {
    const { domain, ...rest } = validInsight();
    const result = InsightFrontmatter.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing resolutions", () => {
    const { resolutions, ...rest } = validInsight();
    const result = InsightFrontmatter.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects invalid ID format — missing hex suffix", () => {
    const data = { ...validInsight(), id: "INS-0042" };
    const result = InsightFrontmatter.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects invalid ID format — wrong prefix", () => {
    const data = { ...validInsight(), id: "SRC-250315-A1B2" };
    const result = InsightFrontmatter.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects invalid enum value for confidence (wrong case)", () => {
    const data = { ...validInsight(), confidence: "High" };
    const result = InsightFrontmatter.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects invalid enum value for actionability", () => {
    const data = { ...validInsight(), actionability: "maybe" };
    const result = InsightFrontmatter.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects invalid enum value for shelf_life", () => {
    const data = { ...validInsight(), shelf_life: "permanent" };
    const result = InsightFrontmatter.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects invalid enum value for status", () => {
    const data = { ...validInsight(), status: "archived" };
    const result = InsightFrontmatter.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects negative access_count", () => {
    const data = { ...validInsight(), access_count: -1 };
    const result = InsightFrontmatter.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects non-integer access_count", () => {
    const data = { ...validInsight(), access_count: 1.5 };
    const result = InsightFrontmatter.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("allows optional fields to be absent", () => {
    const data = validInsight();
    // subtopic and related are optional — not present
    expect(data).not.toHaveProperty("subtopic");
    expect(data).not.toHaveProperty("related");
    const result = InsightFrontmatter.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("accepts all valid confidence enum values", () => {
    for (const val of ["pending", "low", "medium", "high", "very_high"]) {
      const data = { ...validInsight(), confidence: val };
      expect(InsightFrontmatter.safeParse(data).success).toBe(true);
    }
  });

  it("accepts all valid actionability enum values", () => {
    for (const val of ["immediate", "reference", "inspiration"]) {
      const data = { ...validInsight(), actionability: val };
      expect(InsightFrontmatter.safeParse(data).success).toBe(true);
    }
  });

  it("accepts all valid status enum values", () => {
    for (const val of ["active", "outdated", "superseded", "applied"]) {
      const data = { ...validInsight(), status: val };
      expect(InsightFrontmatter.safeParse(data).success).toBe(true);
    }
  });

  it("accepts case-insensitive hex in ID", () => {
    const data = { ...validInsight(), id: "INS-250315-a1b2" };
    const result = InsightFrontmatter.safeParse(data);
    expect(result.success).toBe(true);
  });
});

// ─── SourceFrontmatter ────────────────────────────────────────────────

describe("SourceFrontmatter", () => {
  it("accepts a valid well-formed source", () => {
    const result = SourceFrontmatter.safeParse(validSource());
    expect(result.success).toBe(true);
  });

  it("accepts source with optional fields present", () => {
    const data = {
      ...validSource(),
      author: "Jane Doe",
      url: "https://example.com/tdd",
      subreddit: "r/programming",
    };
    const result = SourceFrontmatter.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects missing required field (type)", () => {
    const { type, ...rest } = validSource();
    const result = SourceFrontmatter.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects invalid ID format", () => {
    const data = { ...validSource(), id: "SRC-42-FF" };
    const result = SourceFrontmatter.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects invalid ID prefix", () => {
    const data = { ...validSource(), id: "INS-250315-FF00" };
    const result = SourceFrontmatter.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects invalid type enum", () => {
    const data = { ...validSource(), type: "newspaper" };
    const result = SourceFrontmatter.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("accepts all valid type enum values", () => {
    for (const val of ["reddit", "youtube", "blog", "panel", "paste", "pdf"]) {
      const data = { ...validSource(), type: val };
      expect(SourceFrontmatter.safeParse(data).success).toBe(true);
    }
  });

  it("rejects negative insight_count", () => {
    const data = { ...validSource(), insight_count: -1 };
    const result = SourceFrontmatter.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("allows optional fields to be absent", () => {
    const data = validSource();
    expect(data).not.toHaveProperty("author");
    expect(data).not.toHaveProperty("url");
    expect(data).not.toHaveProperty("subreddit");
    const result = SourceFrontmatter.safeParse(data);
    expect(result.success).toBe(true);
  });
});

// ─── PrincipleFrontmatter ─────────────────────────────────────────────

describe("PrincipleFrontmatter", () => {
  it("accepts a valid well-formed principle", () => {
    const result = PrincipleFrontmatter.safeParse(validPrinciple());
    expect(result.success).toBe(true);
  });

  it("rejects missing required field (summary)", () => {
    const { summary, ...rest } = validPrinciple();
    const result = PrincipleFrontmatter.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects invalid ID format", () => {
    const data = { ...validPrinciple(), id: "PRI-123-AB" };
    const result = PrincipleFrontmatter.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects invalid ID prefix", () => {
    const data = { ...validPrinciple(), id: "INS-250315-00AA" };
    const result = PrincipleFrontmatter.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects invalid confidence enum (wrong case)", () => {
    const data = { ...validPrinciple(), confidence: "High" };
    const result = PrincipleFrontmatter.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects negative supporting_count", () => {
    const data = { ...validPrinciple(), supporting_count: -1 };
    const result = PrincipleFrontmatter.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("accepts with optional deep resolution", () => {
    const data = {
      ...validPrinciple(),
      resolutions: {
        ...validPrinciple().resolutions,
        deep: "Extended discussion of TDD principles.",
      },
    };
    const result = PrincipleFrontmatter.safeParse(data);
    expect(result.success).toBe(true);
  });
});

// ─── MentalModelFrontmatter ──────────────────────────────────────────

describe("MentalModelFrontmatter", () => {
  it("accepts a valid well-formed mental model", () => {
    const result = MentalModelFrontmatter.safeParse(validMentalModel());
    expect(result.success).toBe(true);
  });

  it("rejects missing required field (core_statement)", () => {
    const { core_statement, ...rest } = validMentalModel();
    const result = MentalModelFrontmatter.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects invalid ID format", () => {
    const data = { ...validMentalModel(), id: "MM-42-AB" };
    const result = MentalModelFrontmatter.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects invalid ID prefix", () => {
    const data = { ...validMentalModel(), id: "INS-250315-BEEF" };
    const result = MentalModelFrontmatter.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects empty domains array", () => {
    const data = { ...validMentalModel(), domains: [] };
    const result = MentalModelFrontmatter.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects invalid confidence enum", () => {
    const data = { ...validMentalModel(), confidence: "Very High" };
    const result = MentalModelFrontmatter.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects non-boolean transferable", () => {
    const data = { ...validMentalModel(), transferable: "yes" };
    const result = MentalModelFrontmatter.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects negative supporting_count", () => {
    const data = { ...validMentalModel(), supporting_count: -5 };
    const result = MentalModelFrontmatter.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("accepts multiple domains", () => {
    const data = {
      ...validMentalModel(),
      domains: ["engineering", "psychology", "business"],
    };
    const result = MentalModelFrontmatter.safeParse(data);
    expect(result.success).toBe(true);
  });
});

// ─── TensionFrontmatter ──────────────────────────────────────────────

describe("TensionFrontmatter", () => {
  it("accepts a valid well-formed tension", () => {
    const result = TensionFrontmatter.safeParse(validTension());
    expect(result.success).toBe(true);
  });

  it("accepts tension with optional resolution field", () => {
    const data = {
      ...validTension(),
      status: "resolved_with_nuance" as const,
      resolution: ["Context matters: speed for prototypes, quality for prod."],
    };
    const result = TensionFrontmatter.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects missing required field (side_a)", () => {
    const { side_a, ...rest } = validTension();
    const result = TensionFrontmatter.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing required field (side_b)", () => {
    const { side_b, ...rest } = validTension();
    const result = TensionFrontmatter.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects invalid ID format", () => {
    const data = { ...validTension(), id: "T-42" };
    const result = TensionFrontmatter.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects invalid ID prefix", () => {
    const data = { ...validTension(), id: "INS-250315-DEAD" };
    const result = TensionFrontmatter.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects invalid status enum", () => {
    const data = { ...validTension(), status: "pending" };
    const result = TensionFrontmatter.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("accepts all valid status enum values", () => {
    for (const val of ["unresolved", "resolved", "resolved_with_nuance"]) {
      const data = { ...validTension(), status: val };
      expect(TensionFrontmatter.safeParse(data).success).toBe(true);
    }
  });

  it("allows resolution to be absent", () => {
    const data = validTension();
    expect(data).not.toHaveProperty("resolution");
    const result = TensionFrontmatter.safeParse(data);
    expect(result.success).toBe(true);
  });
});
