# Universal Content Ingestion Pipeline (Phase 6–7)

**Date:** 2026-03-20
**Status:** Approved
**Author:** Jin Choi + Claude
**Depends on:** Phases 1–4 (complete), Phase 5 (learning mechanisms — complete)

---

## Executive Summary

A universal content ingestion pipeline that accepts any URL — YouTube, blog, Reddit, PDF — and produces indexed, embedded, connected knowledge in three commands. The pipeline separates **deterministic I/O** (fetching, cleaning, file creation, validation) from **semantic reasoning** (insight extraction), playing to the strengths of each paradigm: TypeScript handles the brittle mechanical work, Claude focuses 100% of its token bandwidth on thinking.

Two new scripts:
1. `scripts/ingest.ts` — URL → clean content (fetch, detect type, clean, save source)
2. `scripts/extract.ts` — JSON → batch insight file creation (Zod-validated, stateless)

---

## Problem Statement

The Brain Engine has 74 insights from 18 sources. This is below the critical mass needed for learning mechanisms to fire meaningfully:
- Connection discovery needs embedding density
- Principle emergence triggers at 5:1 insight-to-principle ratio per topic
- Confidence propagation needs cross-source corroboration
- Semantic clustering triggers after 20 new insights

The bottleneck is **ingestion friction**. Currently, each source requires manual fetching, manual reading, and manual file creation (one Write tool call per insight). A 15-insight video requires ~15 Write calls — slow, error-prone, and expensive in token cost.

**Goal:** Reduce ingestion to "send a URL" → three commands → fully indexed knowledge.

---

## The Flow

```
User: "https://youtu.be/xyz"

Step 1 — INGEST (one Bash call)
  Claude runs: npx tsx scripts/ingest.ts https://youtu.be/xyz
  → auto-detects URL type (YouTube)
  → yt-dlp grabs transcript (json3 format) + metadata
  → cleans transcript: deduplicates, paragraph breaks at gaps, chapter headers
  → saves raw file to sources/youtube/raw/{slug}.json3
  → creates source .md with frontmatter (insight_count: 0)
  → if ≤3,000 words: prints clean text with metadata header to stdout
  → if >3,000 words: saves to sources/youtube/raw/{slug}.clean.txt,
    prints metadata header + file path only

Step 2 — EXTRACT (one Write + one Bash call)
  Claude reads content (inline from stdout or via Read tool for long content)
  Claude reasons and structures insights as JSON
  Claude writes JSON to /tmp/zuhn-extract.json (Write tool)
  Claude runs: npx tsx scripts/extract.ts \
    --source SRC-260320-XXXX \
    --file /tmp/zuhn-extract.json \
    --post-ingest
  → validates JSON with Zod (truncation detection via try/catch)
  → batch-writes all insight files with auto-generated IDs, frontmatter, slugs
  → updates source .md: sets insight_count, writes body summary
  → runs post-ingest pipeline (health → reindex → embed → learn → auto-commit)
  → prints summary: "Created N insights in M topics. Pipeline complete."
```

**Three tool calls total: Bash → Write → Bash.**
Works identically for YouTube, blogs, Reddit, and PDFs.

---

## URL Type Detection

**Module:** `scripts/lib/ingest/detect.ts`

```typescript
type ContentType = "youtube" | "reddit" | "blog" | "pdf";
function detectType(url: string): ContentType
```

**Note:** `ContentType` is a subset of the full `SourceFrontmatter.type` enum (which also includes `"panel"` and `"paste"`). This enum covers only URL-based ingestion types. Panel and paste sources continue to be created manually by Claude.

| Pattern | Type | Notes |
|---------|------|-------|
| `youtu.be/*`, `youtube.com/watch*`, `youtube.com/shorts/*`, `m.youtube.com/*` | youtube | All YouTube URL variants normalized |
| `reddit.com/*`, `old.reddit.com/*` | reddit | Both old and new Reddit |
| `*.pdf` or `Content-Type: application/pdf` (HEAD request) | pdf | Extension check first, then HEAD |
| Everything else | blog | Default — readability extraction |

**Edge cases:**
- YouTube playlists → error: `"This is a playlist. Pass individual video URLs."`
- Mobile URLs (`m.youtube.com`) → normalized to standard form
- Tracking params (`?utm_source=...`) → stripped before processing

**URL normalization:** Before detection, the input URL is cleaned:
1. Strip tracking parameters (`utm_*`, `ref`, `source`, `si`)
2. Normalize `m.youtube.com` → `youtube.com`
3. Normalize `old.reddit.com` → `reddit.com` (internally; fetch may use old.reddit.com)

---

## YouTube Ingestion

**Module:** `scripts/lib/ingest/youtube.ts`

### Fetch Strategy

Two `yt-dlp` calls:

1. **Metadata:** `yt-dlp --dump-json <url>`
   - Extracts: title, channel, duration, view_count, upload_date, chapters, automatic_captions availability
   - Single JSON blob, parsed with Zod for safety

2. **Transcript:** `yt-dlp --write-auto-sub --write-sub --sub-lang en --sub-format json3 --skip-download -o {output_path} <url>`
   - Downloads subtitle file in **json3 format** (NOT VTT)
   - json3 provides a clean JSON array of word-level timing events
   - Avoids the VTT "rolling buffer" / karaoke-style deduplication nightmare

### Why json3, Not VTT

YouTube auto-generated VTTs use a rolling buffer where each caption line is an expanding prefix of the next:
```
Line 1: The
Line 2: The quick
Line 3: The quick brown
```
Standard line deduplication produces stuttering text. The json3 format stores each word as a discrete event with exact timing, making clean text extraction trivial: iterate the array, concatenate words, insert breaks at gaps.

### Transcript Cleaning

**Module:** `scripts/lib/ingest/transcript-clean.ts`

Processing steps:
1. Parse json3 events array
2. Concatenate words sequentially (each event = one word/phrase with timing)
3. Insert paragraph break at timestamp gaps >3 seconds (natural topic shifts)
4. If chapters available from metadata: insert `## {chapter_title} ({start}–{end})` headers at chapter boundaries
5. Strip `[Music]`, `[Applause]` markers but preserve `[inaudible]` as quality signal
6. No re-punctuation — Claude handles this during semantic extraction

### Output

If transcript ≤3,000 words, printed to stdout with metadata header:

```
SUCCESS: Source created as SRC-260320-A1B2

## Source Metadata
- Type: YouTube
- Title: "50 AI Agents Running My Company Is a Lie"
- Channel: EO (Entrepreneurs' Organization)
- Duration: 16:42
- Views: 47,000
- Upload Date: 2026-03-15
- Chapters: 5
- Transcript: auto-generated
- Word count: 3,247
- Existing domains: ai-development, automation, music-production, video-production, investing

## Chapters
1. Introduction (0:00–2:15)
2. Why AI Agents Fail (2:15–6:30)
3. The Falsification Mindset (6:30–9:45)
4. Hiring from Customers (9:45–13:20)
5. Opportunity Cost of Big Tech (13:20–16:42)

## Transcript
[clean text with chapter headers inline]
```

If transcript >3,000 words:
```
SUCCESS: Source created as SRC-260320-A1B2

## Source Metadata
[same as above]

Transcript saved to: knowledge-base/sources/youtube/raw/gumloop-50-agents-is-a-lie.clean.txt
Word count: 12,847 (8 chapters)
Use Read tool to analyze, then create extraction JSON.
```

The `SRC-XXXXXX-XXXX` ID is printed prominently at the top so Claude can use it in the extract.ts command.

### Failure Modes

| Failure | Message |
|---------|---------|
| No English captions | `"No English captions available. Paste transcript manually or wait for Phase 13 (Whisper)."` |
| Private/deleted video | `"Video unavailable. Check URL and try again."` |
| yt-dlp outdated | `"yt-dlp error: {message}. Run 'yt-dlp -U' to update."` |
| YouTube Shorts (no captions) | Same as no captions — Shorts often lack auto-subs |

### Files Created

- Raw: `sources/youtube/raw/{slug}.json3`
- Clean (if >3K words): `sources/youtube/raw/{slug}.clean.txt`
- Source: `sources/youtube/{slug}.md`

---

## Blog Ingestion

**Module:** `scripts/lib/ingest/blog.ts`

### Fetch Strategy

```
fetch(url, { timeout: 10_000 })
  → HTML string
  → JSDOM parses to DOM
  → Readability extracts article content
  → extract OpenGraph / JSON-LD metadata (title, author, site_name, publish_date)
  → clean text output
```

### Metadata Extraction Priority

1. JSON-LD (`<script type="application/ld+json">`) — most structured
2. OpenGraph meta tags (`og:title`, `og:author`, `article:published_time`)
3. Standard meta tags (`<title>`, `<meta name="author">`)
4. Readability's own extraction (title, byline)

### Failure Modes

| Failure | Detection | Message |
|---------|-----------|---------|
| Paywall | Content length < 500 chars + common paywall patterns | `"Content appears paywalled. Paste the article text manually."` |
| SPA / JS-rendered | Readability returns empty/minimal content | `"Could not extract content (JS-rendered page). Paste text manually."` |
| Timeout | fetch >10s | `"Request timed out. Check URL and try again."` |

### Files Created

- Raw: `sources/blog/raw/{slug}.html`
- Clean (if >3K words): `sources/blog/raw/{slug}.clean.txt`
- Source: `sources/blog/{slug}.md`

### New Dependencies

| Package | Purpose | Size |
|---------|---------|------|
| `jsdom` | HTML DOM parsing for Readability | ~2MB |
| `@mozilla/readability` | Article content extraction (Firefox Reader View algorithm) | ~50KB |

---

## Reddit Ingestion

**Module:** `scripts/lib/ingest/reddit.ts`

### Fetch Strategy (Three-Tier Fallback)

1. **Primary:** `fetch("{url}.json")` with custom User-Agent
   - User-Agent: `BrainEngine-LocalIngest/1.0 (by /u/chlwlsdud)`
   - Reddit API guidelines require a descriptive User-Agent for safe rate-limit tier
   - Extracts: title, author, subreddit, selftext, score, created_utc, num_comments

2. **Fallback 1:** `fetch("https://old.reddit.com{path}")` + HTML parsing
   - old.reddit.com has simpler HTML structure, easier to parse
   - Extract post body from `.usertext-body` div

3. **Fallback 2:** Manual paste
   - `"Reddit blocked automated access. Paste the post content into conversation."`

### Comment Extraction

For comment threads (URL contains `/comments/`):
- Extract top-level comments sorted by score (from .json response)
- Include author, score, and body for top 10 comments
- Skip deleted/removed comments

### Files Created

- Raw: `sources/reddit/raw/{slug}.json` (or `.html` or `.txt` depending on fallback)
- Source: `sources/reddit/{slug}.md`

---

## PDF Ingestion

**Module:** `scripts/lib/ingest/pdf.ts`

### Strategy

PDFs are the simplest case. The `ingest.ts` script handles downloading/copying and source file creation. Claude then reads the PDF directly using the Read tool (which natively supports PDF rendering) in conversation, outside the script.

1. If URL provided → download to `sources/pdf/raw/{slug}.pdf`
2. If local file path → copy to `sources/pdf/raw/{slug}.pdf`
3. Create source .md with basic metadata (title from filename or URL, date)
4. Print: `"PDF saved to {path}. Use Read tool to review, then create extraction JSON."`

No text extraction library needed — the script handles file management, Claude handles reading in conversation.

### Files Created

- Raw: `sources/pdf/raw/{slug}.pdf`
- Source: `sources/pdf/{slug}.md`

---

## Duplicate Detection

Before fetching any content, `ingest.ts` checks for existing source files with the same URL:

```typescript
// Scan all source .md files for matching url in frontmatter
const existingSources = await findSourceByUrl(url);
if (existingSources.length > 0) {
  console.error(`Source already ingested as ${existingSources[0].id}.`);
  console.error(`Use --force to re-ingest.`);
  process.exit(1);
}
```

The `--force` flag allows re-ingestion:
- Creates a **new** source .md with a fresh SRC ID and today's date
- Does **not** delete or modify the old source file (it remains in the knowledge base)
- Insights from the old source remain linked to the old SRC ID — they are not orphaned or re-linked
- Use case: re-extract with better prompting or after the source content has been updated

---

## The Extraction Script

**File:** `scripts/extract.ts`

### Purpose

Takes Claude's structured JSON → batch-writes insight files with auto-generated metadata. This is the core architectural innovation: Claude only provides semantic value, TypeScript handles all mechanical I/O.

### Input JSON Schema

**New file:** `scripts/schemas/extraction.ts` (must be created alongside the script)

```typescript
// scripts/schemas/extraction.ts
import { z } from "zod";

export const ExtractionInsight = z.object({
  domain: z.string(),
  topic: z.string(),
  subtopic: z.string().optional(),
  title: z.string(),
  actionability: z.enum(["immediate", "reference", "inspiration"]),
  confidence: z.enum(["pending", "low", "medium", "high", "very_high"]),
  shelf_life: z.enum(["evergreen", "time-sensitive"]),
  tags: z.array(z.string()),
  resolutions: z.object({
    one_line: z.string(),
    standard: z.string(),
    deep: z.string().optional(),
  }),
});

export const ExtractionInput = z.object({
  source_summary: z.string(),
  insights: z.array(ExtractionInsight),
});
```

**Note:** `source_id` is NOT in the JSON schema. It is passed via the `--source` CLI flag only. This avoids redundancy between the JSON content and the CLI argument.

### What Claude Provides (Semantic Only)

- `domain` — which knowledge domain
- `topic` — which topic within the domain
- `title` — clear, actionable insight title
- `actionability` — how immediately applicable
- `confidence` — how confident in correctness
- `shelf_life` — will this expire?
- `tags` — cross-referencing terms
- `resolutions` — the actual knowledge at three zoom levels
- `source_summary` — 2-3 sentence description of the source content

### What the Script Auto-Generates

| Field | Source |
|-------|--------|
| `id` | `generateInsightId(title, batchIndex)` — see ID Generation Changes below |
| `status` | `"active"` |
| `date_extracted` | Today's date |
| `last_accessed` | `null` |
| `access_count` | `0` |
| `indexed` | `false` |
| `embedded` | `false` |
| `sources` | Auto-populated from source_id (reads source .md for type, title, author, url) |
| `related` | `[]` (populated later by learn.ts) |
| File path | `knowledge-base/domains/{domain}/{topic}/{slug}.md` |
| Slug | Deterministic kebab-case from title |
| Directories | Auto-created if domain/topic doesn't exist |

### Slug Collision Handling

Before writing each file, check if the path already exists:
```typescript
if (existsSync(filePath)) {
  // Append 4-char hash suffix to slug
  const suffix = generateId("", title).slice(-4).toLowerCase();
  filePath = filePath.replace(".md", `-${suffix}.md`);
}
```
This prevents cross-session collisions when two different insights produce the same slug.

### JSON Truncation Detection

Claude has output token limits. If a long extraction is truncated mid-write, the JSON file will be malformed.

```typescript
let parsed: ExtractionInput;
try {
  const raw = await readFile(filePath, "utf-8");
  parsed = ExtractionInput.parse(JSON.parse(raw));
} catch (err) {
  if (err instanceof SyntaxError) {
    console.error("Error: Malformed JSON — likely truncated.");
    console.error("If extracting many insights, write in batches of 8-10.");
    console.error("Run extract.ts after each batch (it appends to insight_count).");
    process.exit(1);
  }
  throw err;
}
```

### Batch Extraction Support

The script naturally supports batching because it **appends** to the source's `insight_count` rather than setting it. Claude can extract 8 insights, run extract.ts, then extract 8 more and run it again. Each batch adds to the same source.

### Source File Update

After writing insight files, the script:
1. Reads the source .md file (by `source_id`)
2. Updates `insight_count` to current total (existing + new)
3. Writes `source_summary` as the markdown body (below frontmatter)

### Post-Ingest Integration

If `--post-ingest` flag is passed:
```typescript
if (flags.postIngest) {
  execFileSync("npx", ["tsx", join(PROJECT_ROOT, "scripts/post-ingest.ts")], {
    stdio: "inherit",
    cwd: PROJECT_ROOT,
  });
}
```

**Duration note:** With `--post-ingest`, the command blocks while the pipeline runs. The `embed.ts` step hits Ollama for each new insight (embedding generation). For a batch of 12 insights, expect 30-60 seconds total depending on Ollama performance. Without `--post-ingest`, the extract step itself completes in <1 second.

### CLI Interface

```bash
npx tsx scripts/extract.ts \
  --source SRC-260320-A1B2 \
  --file /tmp/zuhn-extract.json \
  --post-ingest    # optional: run pipeline after extraction
```

### Output

```
Validated 12 insights (0 errors)
Created 12 insight files:
  ai-development/automation (4 new)
  startups/fundraising (3 new) ← new topic created
  startups/hiring (5 new)
Updated source SRC-260320-A1B2 (insight_count: 12)
Running post-ingest pipeline...
[pipeline output]
```

---

## Schema Changes

### SourceFrontmatter Extensions

Add optional type-specific fields to the existing schema (non-breaking):

```typescript
// Added to existing SourceFrontmatter in scripts/schemas/frontmatter.ts

// YouTube-specific
channel: z.string().optional(),
duration: z.string().optional(),                         // "16:42" format
views: z.number().optional(),
upload_date: z.string().optional(),
chapters: z.number().optional(),
transcript_type: z.enum(["auto", "manual"]).optional(),

// Blog-specific
site_name: z.string().optional(),
publish_date: z.string().optional(),

// Reddit-specific (subreddit already exists in schema)
score: z.number().optional(),
num_comments: z.number().optional(),

// Shared
word_count: z.number().optional(),                       // Blog/YouTube/Reddit
```

All optional. Existing source files pass validation unchanged.

### ID Generation Changes

**File:** `scripts/lib/generate-id.ts`

The existing `generateInsightId(title: string)` must be updated to accept an optional salt parameter to prevent batch collisions:

```typescript
// Updated signature
function generateId(prefix: string, title: string, salt?: string | number): string {
  const hashInput = salt !== undefined ? `${title}:${salt}` : title;
  const hash = createHash("sha256").update(hashInput).digest("hex");
  // ... rest unchanged
}
```

When `extract.ts` generates IDs for a batch, it passes the array index as salt:
```typescript
const id = generateInsightId(insight.title, index);
```

This ensures two insights with identical titles in the same batch get different IDs. Cross-session collisions remain astronomically unlikely (same title + same day + same hash suffix = 1 in 65,536).

---

## File Organization

### New Scripts

```
scripts/
├── ingest.ts                        ← CLI: URL → clean content
├── extract.ts                       ← CLI: JSON → batch insight files
├── lib/ingest/
│   ├── detect.ts                    ← URL → ContentType
│   ├── youtube.ts                   ← yt-dlp (json3) + metadata
│   ├── blog.ts                      ← fetch + readability + jsdom
│   ├── reddit.ts                    ← .json API + fallbacks
│   ├── pdf.ts                       ← download/copy
│   ├── transcript-clean.ts          ← json3 → clean paragraphs with chapters
│   └── slug.ts                      ← title → filesystem-safe kebab-case
└── lib/extract/
    └── write-insights.ts            ← JSON → batch file creation + source update
```

### Knowledge Base Source Organization

```
knowledge-base/sources/
├── youtube/
│   ├── raw/                         ← .json3 files + .clean.txt (if long)
│   └── {slug}.md                    ← source frontmatter
├── blog/
│   ├── raw/                         ← .html files + .clean.txt (if long)
│   └── {slug}.md
├── reddit/
│   ├── raw/                         ← .json/.html/.txt files
│   └── {slug}.md
└── pdf/
    ├── raw/                         ← .pdf files
    └── {slug}.md
```

### package.json Changes

```json
{
  "scripts": {
    "ingest": "tsx scripts/ingest.ts",
    "extract": "tsx scripts/extract.ts"
  },
  "dependencies": {
    "jsdom": "^26.x",
    "@mozilla/readability": "^0.6.x"
  },
  "devDependencies": {
    "@types/jsdom": "^21.x"
  }
}
```

---

## Testing Plan

All tests use Vitest (matching existing infrastructure).

| Module | Test Type | What's Tested |
|--------|-----------|---------------|
| `detect.ts` | Unit | URL classification: YouTube variants, Reddit, PDF, blog default, edge cases (playlists, mobile, tracking params) |
| `transcript-clean.ts` | Unit | json3 input → clean text with paragraph breaks and chapter headers |
| `slug.ts` | Unit | Title → kebab-case: special chars, unicode, long titles, collision-prone titles |
| `write-insights.ts` | Unit | JSON → valid insight files: correct frontmatter, slugs, directory creation, collision handling |
| `extract.ts` | Unit | End-to-end: JSON validation, truncation detection, batch writing, source update, insight_count append |
| `blog.ts` | Unit | Sample HTML → extracted text + metadata (OpenGraph, JSON-LD, fallbacks) |
| `reddit.ts` | Unit | Sample .json response → extracted post + comments |
| `youtube.ts` | Integration (skippable) | yt-dlp metadata + json3 transcript (requires network + yt-dlp) |

### Test Data

Create `tests/fixtures/ingest/` with:
- `sample.json3` — real YouTube json3 subtitle file for transcript cleaning tests
- `sample-article.html` — real blog HTML for readability tests
- `sample-reddit.json` — real Reddit .json response for parsing tests
- `sample-extraction.json` — valid ExtractionInput for write-insights tests

---

## What's Deliberately Omitted

| Omitted | Why |
|---------|-----|
| Whisper transcription fallback | Spec Phase 13 — don't jump ahead |
| Twitter/HN/podcast support | Architecture makes adding trivial later |
| Semantic deduplication | URL matching sufficient at personal scale |
| Re-punctuation of auto-captions | Claude handles during extraction |
| Readability alternatives for SPAs | Manual paste fallback is fine for 5% edge case |
| Playlist auto-processing | Dangerous at scale — detect and warn |

---

## Success Criteria

1. `npx tsx scripts/ingest.ts <youtube_url>` produces a clean, chapter-segmented transcript ready for Claude to read
2. `npx tsx scripts/ingest.ts <blog_url>` produces clean article text with metadata
3. `npx tsx scripts/extract.ts --source SRC-xxx --file insights.json --post-ingest` batch-writes all insight files and runs the full pipeline
4. All generated files pass `health.ts` validation
5. End-to-end: URL → indexed, embedded, connected insights in one conversation turn
6. Existing 74 insights and 18 sources are unaffected (non-breaking changes)

---

## Implementation Order

Per design review recommendation, build from the inside out:

1. **Schema changes first** — update `SourceFrontmatter` (optional fields), update `generate-id.ts` (salt parameter), create new `scripts/schemas/extraction.ts`
2. **`slug.ts`** — pure utility, easy to test, needed by everything
3. **`write-insights.ts` + `extract.ts`** — the core innovation. Test with mock JSON against existing health.ts validation
4. **`detect.ts`** — URL classification, pure function tests
5. **`transcript-clean.ts`** — json3 → clean text, test with fixtures
6. **`youtube.ts`** — wire up yt-dlp, integration test
7. **`blog.ts`** — readability + jsdom, test with HTML fixtures
8. **`reddit.ts`** — .json API + fallbacks
9. **`pdf.ts`** — simplest fetcher
10. **`ingest.ts`** — CLI entry point that wires everything together
11. **`package.json`** — new deps + scripts

---

## Appendix: Implementation Gotchas

Six code-level quirks identified during review that must be handled proactively:

### 1. Code Fence JSON Trap (`extract.ts`)

Claude's RLHF training causes it to occasionally wrap file contents in markdown code fences (`` ```json ... ``` ``) even when instructed to write raw JSON. Strip before parsing:

```typescript
let raw = await readFile(filePath, "utf-8");
raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
const parsed = JSON.parse(raw);
```

### 2. Cross-Batch Salt Uniqueness (`extract.ts`)

The batch index alone isn't sufficient for cross-batch uniqueness. If two batches both start at index 0 and share a title, IDs collide. Include source_id + timestamp:

```typescript
const salt = `${flags.source}-${Date.now()}-${index}`;
const id = generateInsightId(insight.title, salt);
```

### 3. Manual vs Auto json3 Structure (`transcript-clean.ts`)

Manual captions put text directly on `event.utf8`. Auto-captions use word-level `event.segs[]` array. Handle both:

```typescript
const text = event.segs
  ? event.segs.map((s: { utf8: string }) => s.utf8).join("")
  : event.utf8 || "";
```

### 4. yt-dlp stdout Pollution (`youtube.ts`)

`yt-dlp --dump-json` sometimes prints warnings before the JSON blob, crashing `JSON.parse()`. Suppress with:

```bash
yt-dlp --dump-json --no-warnings --quiet <url>
```

### 5. JSDOM Relative URL Resolution (`blog.ts`)

Pass the original URL to JSDOM so relative links (`/pricing`) resolve to absolute paths:

```typescript
const dom = new JSDOM(htmlString, { url: targetUrl });
```

### 6. Forgiving Zod Enums (`schemas/extraction.ts`)

Claude will occasionally output `"Immediate"` or `"Very_High"` instead of lowercase. Use `z.preprocess` to normalize:

```typescript
const lowerCase = (val: unknown) =>
  typeof val === "string" ? val.toLowerCase() : val;

confidence: z.preprocess(lowerCase, z.enum(["pending", "low", "medium", "high", "very_high"])),
actionability: z.preprocess(lowerCase, z.enum(["immediate", "reference", "inspiration"])),
shelf_life: z.preprocess(lowerCase, z.enum(["evergreen", "time-sensitive"])),
```

---

Built by Jin Choi + Claude.
