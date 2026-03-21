import { describe, it, expect } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("converts spaces to hyphens", () => {
    expect(slugify("hello world")).toBe("hello-world");
  });

  it("lowercases everything", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(slugify("What's the deal?!")).toBe("whats-the-deal");
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("this --- is -- weird")).toBe("this-is-weird");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  --hello-- ")).toBe("hello");
  });

  it("handles unicode by stripping non-ASCII", () => {
    expect(slugify("Café résumé")).toBe("cafe-resume");
  });

  it("handles long titles by truncating", () => {
    const long = "a".repeat(200);
    const result = slugify(long);
    expect(result.length).toBeLessThanOrEqual(80);
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("untitled");
  });

  it("handles strings that become empty after stripping", () => {
    expect(slugify("!!!")).toBe("untitled");
  });

  it("matches existing knowledge base slug patterns", () => {
    expect(slugify("Charge premium from day one")).toBe("charge-premium-from-day-one");
    expect(slugify("Build Navy SEALs not the Navy content team")).toBe(
      "build-navy-seals-not-the-navy-content-team"
    );
  });
});
