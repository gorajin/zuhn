# Zuhn — Claude Code Instructions

## Project Overview

Zuhn is a personal knowledge operating system. It ingests content (YouTube, blogs, Reddit, PDFs, audio recordings), extracts insights via Claude-in-conversation, and stores them in a 5-level compression hierarchy with 7 automated learning mechanisms. All 14 phases are implemented.

## The Golden Rule

**Never manually write insight/principle/source files with Write/Edit tools.** All complex I/O passes through structured, Zod-validated JSON to a TypeScript script:
- Insights → write JSON → `scripts/extract.ts`
- Principles → write JSON → `scripts/create-principles.ts`
- Sources → `scripts/ingest.ts` handles automatically

## Ingestion Workflow

When the user shares a URL or file path:

```
1. npx tsx scripts/ingest.ts <url-or-path>
   → auto-detects type, fetches/transcribes, creates source .md
   → prints SRC-XXXXXX-XXXX ID + clean content

2. Read the content, extract insights as JSON, write to /tmp/zuhn-extract.json

3. npx tsx scripts/extract.ts --source SRC-XXXXXX-XXXX --file /tmp/zuhn-extract.json --post-ingest
   → batch-writes insight files, runs full pipeline
```

For >8-10 insights, batch the extraction (write 8, run extract, write more).

## Compression Workflow

When `meta/flags.md` shows COMPRESS flags:

```
1. npx tsx scripts/compress.ts --topic domain/topic
   → outputs structured prompt with insights to compress

2. Identify patterns, write principles as JSON to /tmp/zuhn-principles.json

3. npx tsx scripts/create-principles.ts --file /tmp/zuhn-principles.json --post-ingest
```

## Session Persistence (Sleep/Wake)

When the user says "sleep":
1. Write session state as JSON to `/tmp/zuhn-sleep.json`
2. Run `npx tsx scripts/sleep.ts --file /tmp/zuhn-sleep.json`

When the user says "wake":
1. Run `npx tsx scripts/wake.ts` — read the morning briefing
2. Read `meta/flags.md` for learning mechanism flags
3. Open active files from the briefing

## Key Scripts

| Command | Purpose |
|---------|---------|
| `npm run ingest <url>` | Ingest any content |
| `npm run extract` | Batch-write insights from JSON |
| `npm run post-ingest` | Full pipeline (health → reindex → embed → learn → views → git) |
| `npm run search "query"` | Hybrid search |
| `npm run compress` | Compression prompts |
| `npm run health` | Validate everything |
| `npm run learn` | Run 8 learning mechanisms |
| `npm run views` | Regenerate all views |
| `npm run resurface` | Daily digest |
| `npm run archive` | Intelligent forgetting (use --dry-run first) |
| `npm run wake` / `npm run sleep` | Session persistence |
| `npx tsx scripts/decide.ts --file <json>` | Create decision records from JSON |
| `npx tsx scripts/predict.ts --file <json>` | Create prediction records from JSON |
| `npx tsx scripts/resolve.ts --id <ID> --status <STATUS> --notes <NOTES>` | Resolve a prediction or decision |
| `npx tsx scripts/split-topic.ts` | Move insights between topics |

## Architecture Boundaries

- **TypeScript** handles: file I/O, YAML parsing, vector math, clustering, graph traversal, validation
- **Claude** handles: semantic reasoning, insight extraction, compression, tension resolution
- **Ollama** handles: embedding generation (isolated in `embed.ts` only)
- **Whisper** handles: audio transcription (isolated in `audio.ts` only)
- **Never** call Ollama or Whisper from `learn.ts` — it must be pure local math on the SQLite DB

## Extraction JSON Format

When extracting insights, output this structure:

```json
{
  "source_summary": "2-3 sentence description of the source",
  "insights": [
    {
      "domain": "ai-development",
      "topic": "automation",
      "title": "Clear actionable title",
      "actionability": "immediate",
      "confidence": "medium",
      "shelf_life": "evergreen",
      "tags": ["tag1", "tag2"],
      "resolutions": {
        "one_line": "Single sentence summary",
        "standard": "2-3 paragraph explanation with context and application"
      }
    }
  ]
}
```

## ID System

All IDs are stateless (timestamp + hash, no counters):
- Insights: `INS-YYMMDD-XXXX`
- Principles: `PRI-YYMMDD-XXXX`
- Mental Models: `MM-YYMMDD-XXXX`
- Sources: `SRC-YYMMDD-XXXX`
- Tensions: `T-YYMMDD-XXXX`

## File Structure

- Knowledge base: `knowledge-base/` (source of truth, markdown + YAML)
- Scripts: `scripts/` (20 TypeScript scripts)
- Schemas: `scripts/schemas/` (Zod validation)
- Tests: alongside source files (`*.test.ts`), also `tests/fixtures/`
- Specs: `docs/superpowers/specs/`

## Tech Stack

TypeScript (tsx), Zod, SQLite (better-sqlite3 + FTS5 + sqlite-vec), Ollama (nomic-embed-text), Whisper (local), graphology (Louvain), jsdom + @mozilla/readability, gray-matter, Vitest, Markmap.

## Testing

Run `npm run test` (Vitest). 214 tests across 15 files. Tests live alongside source files.

## Learning Mechanism Flags

After `npm run learn`, check `meta/flags.md` for:
- **COMPRESS** — topic needs insight → principle compression
- **DISCOVER** — cross-topic cluster found by Louvain
- **GAP** — sparse topic adjacent to dense one
- **TRANSFER** — principle may apply to another domain

## Existing Domains

ai-development, automation, startups, video-production, music-production, pets
