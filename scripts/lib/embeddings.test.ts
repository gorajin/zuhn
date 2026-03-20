import { describe, it, expect } from "vitest";
import { isOllamaAvailable, embedText, embedBatch } from "./embeddings";

// ─── Unit tests (no Ollama required) ────────────────────────────────

describe("embeddings", () => {
  describe("isOllamaAvailable", () => {
    it("returns a boolean", async () => {
      const result = await isOllamaAvailable();
      expect(typeof result).toBe("boolean");
    });
  });
});

// ─── Integration tests (require Ollama running) ─────────────────────

const ollamaAvailable = await isOllamaAvailable();

describe.skipIf(!ollamaAvailable)("embeddings (integration)", () => {
  it("embedText returns a 768-dimensional array", async () => {
    const embedding = await embedText("test sentence for embedding");
    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBe(768);
    // All values should be numbers
    for (const val of embedding) {
      expect(typeof val).toBe("number");
      expect(Number.isFinite(val)).toBe(true);
    }
  });

  it("embedText returns different embeddings for different texts", async () => {
    const emb1 = await embedText("dogs love treats");
    const emb2 = await embedText("quantum computing algorithms");

    expect(emb1.length).toBe(768);
    expect(emb2.length).toBe(768);

    // They should not be identical
    let same = true;
    for (let i = 0; i < emb1.length; i++) {
      if (emb1[i] !== emb2[i]) {
        same = false;
        break;
      }
    }
    expect(same).toBe(false);
  });

  it("embedBatch returns embeddings for all inputs", async () => {
    const texts = ["hello world", "goodbye world"];
    const embeddings = await embedBatch(texts);
    expect(embeddings.length).toBe(2);
    expect(embeddings[0].length).toBe(768);
    expect(embeddings[1].length).toBe(768);
  });
});
