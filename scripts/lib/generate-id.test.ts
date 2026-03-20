import { describe, it, expect } from "vitest";
import {
  generateInsightId,
  generateSourceId,
  generatePrincipleId,
  generateMentalModelId,
  generateTensionId,
} from "./generate-id";

const TODAY = new Date();
const YYMMDD =
  String(TODAY.getFullYear()).slice(-2) +
  String(TODAY.getMonth() + 1).padStart(2, "0") +
  String(TODAY.getDate()).padStart(2, "0");

describe("generateInsightId", () => {
  it("returns correct format", () => {
    const id = generateInsightId("Some insight title");
    expect(id).toMatch(/^INS-\d{6}-[0-9A-F]{4}$/);
  });

  it("is deterministic for same title", () => {
    const title = "Deterministic title";
    expect(generateInsightId(title)).toBe(generateInsightId(title));
  });

  it("produces different IDs for different titles", () => {
    expect(generateInsightId("Title A")).not.toBe(generateInsightId("Title B"));
  });

  it("uses today's date in the YYMMDD portion", () => {
    const id = generateInsightId("Any title");
    expect(id.split("-")[1]).toBe(YYMMDD);
  });

  it("uses the INS prefix", () => {
    expect(generateInsightId("Test")).toMatch(/^INS-/);
  });
});

describe("generateSourceId", () => {
  it("returns correct format", () => {
    expect(generateSourceId("Some source")).toMatch(/^SRC-\d{6}-[0-9A-F]{4}$/);
  });

  it("is deterministic", () => {
    const title = "Repeatable source";
    expect(generateSourceId(title)).toBe(generateSourceId(title));
  });

  it("produces different IDs for different titles", () => {
    expect(generateSourceId("Source A")).not.toBe(generateSourceId("Source B"));
  });

  it("uses today's date", () => {
    expect(generateSourceId("Any").split("-")[1]).toBe(YYMMDD);
  });

  it("uses the SRC prefix", () => {
    expect(generateSourceId("Test")).toMatch(/^SRC-/);
  });
});

describe("generatePrincipleId", () => {
  it("returns correct format", () => {
    expect(generatePrincipleId("A principle")).toMatch(
      /^PRI-\d{6}-[0-9A-F]{4}$/
    );
  });

  it("is deterministic", () => {
    const title = "Repeatable principle";
    expect(generatePrincipleId(title)).toBe(generatePrincipleId(title));
  });

  it("produces different IDs for different titles", () => {
    expect(generatePrincipleId("Principle A")).not.toBe(
      generatePrincipleId("Principle B")
    );
  });

  it("uses today's date", () => {
    expect(generatePrincipleId("Any").split("-")[1]).toBe(YYMMDD);
  });

  it("uses the PRI prefix", () => {
    expect(generatePrincipleId("Test")).toMatch(/^PRI-/);
  });
});

describe("generateMentalModelId", () => {
  it("returns correct format", () => {
    expect(generateMentalModelId("A mental model")).toMatch(
      /^MM-\d{6}-[0-9A-F]{4}$/
    );
  });

  it("is deterministic", () => {
    const title = "Repeatable mental model";
    expect(generateMentalModelId(title)).toBe(generateMentalModelId(title));
  });

  it("produces different IDs for different titles", () => {
    expect(generateMentalModelId("Model A")).not.toBe(
      generateMentalModelId("Model B")
    );
  });

  it("uses today's date", () => {
    expect(generateMentalModelId("Any").split("-")[1]).toBe(YYMMDD);
  });

  it("uses the MM prefix", () => {
    expect(generateMentalModelId("Test")).toMatch(/^MM-/);
  });
});

describe("generateTensionId", () => {
  it("returns correct format", () => {
    expect(generateTensionId("A tension")).toMatch(/^T-\d{6}-[0-9A-F]{4}$/);
  });

  it("is deterministic", () => {
    const title = "Repeatable tension";
    expect(generateTensionId(title)).toBe(generateTensionId(title));
  });

  it("produces different IDs for different titles", () => {
    expect(generateTensionId("Tension A")).not.toBe(
      generateTensionId("Tension B")
    );
  });

  it("uses today's date", () => {
    expect(generateTensionId("Any").split("-")[1]).toBe(YYMMDD);
  });

  it("uses the T prefix", () => {
    expect(generateTensionId("Test")).toMatch(/^T-/);
  });
});
