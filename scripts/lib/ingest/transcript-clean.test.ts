import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cleanTranscript } from "./transcript-clean";

const FIXTURE_PATH = join(__dirname, "../../../tests/fixtures/ingest/sample.json3");

describe("cleanTranscript", () => {
  it("concatenates words from segs array", async () => {
    const raw = await readFile(FIXTURE_PATH, "utf-8");
    const result = cleanTranscript(raw);
    expect(result.text).toContain("Hello world.");
  });

  it("handles manual captions (utf8 on event)", async () => {
    const raw = await readFile(FIXTURE_PATH, "utf-8");
    const result = cleanTranscript(raw);
    expect(result.text).toContain("Manual caption line.");
  });

  it("inserts paragraph break at timestamp gaps >3s", async () => {
    const raw = await readFile(FIXTURE_PATH, "utf-8");
    const result = cleanTranscript(raw);
    const paragraphs = result.text.split("\n\n").filter(Boolean);
    expect(paragraphs.length).toBeGreaterThanOrEqual(2);
  });

  it("strips [Music] markers", async () => {
    const raw = await readFile(FIXTURE_PATH, "utf-8");
    const result = cleanTranscript(raw);
    expect(result.text).not.toContain("[Music]");
  });

  it("preserves [inaudible] markers", () => {
    const json = JSON.stringify({
      events: [{ tStartMs: 0, segs: [{ utf8: "Something [inaudible] here." }] }],
    });
    const result = cleanTranscript(json);
    expect(result.text).toContain("[inaudible]");
  });

  it("inserts chapter headers when provided", async () => {
    const raw = await readFile(FIXTURE_PATH, "utf-8");
    const chapters = [
      { title: "Introduction", startMs: 0, endMs: 5000 },
      { title: "Main Content", startMs: 5000, endMs: 10000 },
    ];
    const result = cleanTranscript(raw, chapters);
    expect(result.text).toContain("## Introduction");
    expect(result.text).toContain("## Main Content");
  });

  it("returns word count", async () => {
    const raw = await readFile(FIXTURE_PATH, "utf-8");
    const result = cleanTranscript(raw);
    expect(result.wordCount).toBeGreaterThan(0);
  });
});
