// ─── Ollama Embedding Client ──────────────────────────────────────

const DEFAULT_MODEL = "nomic-embed-text";
const OLLAMA_BASE = "http://localhost:11434";

/**
 * Check if Ollama is running and reachable.
 */
export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Embed a single text string via the Ollama API.
 * Returns an array of floats (768 dimensions for nomic-embed-text).
 */
export async function embedText(
  text: string,
  model: string = DEFAULT_MODEL
): Promise<number[]> {
  const res = await fetch(`${OLLAMA_BASE}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt: text }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Ollama embedding failed (${res.status}): ${body}`
    );
  }

  const json = (await res.json()) as { embedding: number[] };

  if (!Array.isArray(json.embedding) || json.embedding.length === 0) {
    throw new Error(
      `Ollama returned invalid embedding: expected array, got ${typeof json.embedding}`
    );
  }

  return json.embedding;
}

/**
 * Embed multiple texts sequentially via Ollama.
 * Ollama does not support native batch embedding, so we call embedText in a loop.
 * Logs progress to stdout.
 */
export async function embedBatch(
  texts: string[],
  model: string = DEFAULT_MODEL
): Promise<number[][]> {
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i++) {
    console.log(`Embedding ${i + 1}/${texts.length}...`);
    const embedding = await embedText(texts[i], model);
    results.push(embedding);
  }

  return results;
}
