# Zuhn

A personal knowledge operating system that ingests any content, extracts every actionable insight via Claude, and continuously gets smarter.

**Not a note-taking app. Not a bookmark manager. A brain.**

## What it does

You feed it content — YouTube videos, blog posts, Reddit threads, PDFs, conference recordings — and it:

1. **Ingests** any URL or audio file with one command
2. **Extracts** every discrete, actionable insight (Claude reasons, TypeScript writes files)
3. **Organizes** them into a 5-level compression hierarchy (raw sources → insights → principles → mental models)
4. **Searches** via hybrid keyword + semantic search (SQLite FTS5 + Ollama embeddings)
5. **Learns** — discovers connections, clusters topics, detects gaps, transfers principles across domains, flags contradictions
6. **Compresses** knowledge upward (insights → principles → mental models)
7. **Forgets** intelligently — archives stale and low-value insights
8. **Resurfaces** forgotten knowledge via daily digests
9. **Visualizes** as an interactive zoomable mindmap

## The 5 Levels of Knowledge

```
Level 5: MENTAL MODELS        — Transferable frameworks across domains
Level 4: PRINCIPLES           — Synthesized rules backed by evidence
Level 3: INSIGHTS             — Individual knowledge cards (109 and growing)
Level 2: PROCESSED SOURCES    — Summarized, tagged original content
Level 1: RAW INTAKE           — Original content as received
```

Each level compresses the one below. Query cost scales logarithmically — ~800 lines of context for an expert-level answer whether you have 100 or 10,000 insights.

## Quick Start

```bash
# Install dependencies
npm install

# Optional: Install Ollama for semantic search
# https://ollama.com/download
ollama pull nomic-embed-text

# Optional: Install Whisper for audio transcription
pipx install openai-whisper
brew install ffmpeg

# Run the pipeline (validates + indexes + embeds + learns + views)
npm run post-ingest

# Search your knowledge
npm run search "reduce AI costs"
npm run search "planning" -- --hybrid
npm run search "hooks" -- --domain ai-development

# View the mindmap
open knowledge-base/views/mindmap.html

# Health check
npm run health
```

## Ingestion — Feed the Brain

```bash
# YouTube video (auto-downloads transcript via yt-dlp)
npm run ingest https://youtu.be/CxFQykWiJqY

# Blog post (extracts article via readability)
npm run ingest https://blog.example.com/article

# Reddit thread (fetches via .json API)
npm run ingest https://reddit.com/r/ClaudeCode/comments/abc/title

# PDF document
npm run ingest https://example.com/paper.pdf

# Conference recording (transcribes via local Whisper)
npm run ingest /path/to/conference-talk.mp3

# Then Claude extracts insights as JSON, and:
npx tsx scripts/extract.ts --source SRC-XXXXXX-XXXX --file /tmp/zuhn-extract.json --post-ingest
```

Three commands: ingest → extract → post-ingest. Any content type. Fully indexed knowledge.

## All Commands

```bash
# Ingestion
npm run ingest <url-or-path>  # Universal content fetcher (YouTube/blog/Reddit/PDF/audio)
npm run extract               # Batch-write insights from Claude's JSON

# Compression
npm run compress              # Identify topics ready for compression
npm run create-principles     # Batch-write principles from Claude's JSON

# Pipeline
npm run post-ingest           # Full pipeline: health → reindex → embed → learn → views → git
npm run health                # Validate all frontmatter + referential integrity
npm run reindex               # Rebuild all indices
npm run embed                 # Generate/update Ollama embeddings
npm run learn                 # Run all 7 learning mechanisms

# Search
npm run search "query"        # Keyword search (FTS5 BM25)
npm run search "query" -- --semantic   # Vector search (cosine similarity)
npm run search "query" -- --hybrid     # Hybrid search (Reciprocal Rank Fusion)

# Views
npm run views                 # Generate all filtered views
npm run mindmap               # Generate interactive mindmap
npm run resurface             # Daily digest of insights to review

# Knowledge Management
npm run archive               # Archive stale/low-value insights (--dry-run to preview)
npm run resurrect             # Un-archive an insight (--id INS-XXXXXX-XXXX)

# Session Persistence
npm run sleep                 # Save session state to meta/session.md
npm run wake                  # Morning briefing: session + flags + pending + stats

# Testing
npm run test                  # Run all 214 tests
npm run test:watch            # Watch mode
```

## Architecture

```
knowledge-base/                    ← Source of truth (markdown + YAML frontmatter)
├── MASTER_INDEX.md                ← Boot file — read this first
├── domains/{domain}/{topic}/*.md  ← Insight files (Zod-validated)
├── principles/{domain}/*.md       ← Synthesized rules from insights
├── mental-models/*.md             ← Transferable frameworks
├── tensions/*.md                  ← Tracked contradictions + resolutions
├── sources/{type}/*.md            ← Where insights came from
├── archive/{reason}/*.md          ← Intelligently archived insights
├── tags/*.md                      ← Cross-reference indices
├── views/                         ← Generated views
│   ├── mindmap.html               ← Interactive zoomable mindmap
│   ├── action-list.md             ← Immediately actionable insights
│   ├── stale-board.md             ← Time-sensitive insights needing review
│   ├── source-map.md              ← Sources ranked by insight density
│   ├── gap-report.md              ← Coverage gaps in knowledge
│   └── daily-digest.md            ← Spaced resurfacing selections
├── meta/                          ← System metadata
│   ├── flags.md                   ← Learning layer flags (COMPRESS/DISCOVER/GAP/TRANSFER)
│   ├── session.md                 ← Persisted session state (sleep/wake)
│   └── stats.md                   ← Knowledge base statistics
└── db/brain.db                    ← SQLite + FTS5 + sqlite-vec

scripts/                           ← TypeScript tooling (20 scripts)
├── schemas/
│   ├── frontmatter.ts             ← Zod schemas for all frontmatter types
│   ├── extraction.ts              ← Zod schema for insight extraction JSON
│   └── session.ts                 ← Zod schema for session state
├── lib/
│   ├── parse-insight.ts           ← gray-matter + Zod parser
│   ├── generate-id.ts             ← Stateless ULID-inspired IDs (with salt)
│   ├── generate-index.ts          ← Builds all hierarchical indices
│   ├── db.ts                      ← SQLite + FTS5 database manager
│   ├── search.ts                  ← FTS5 keyword search + temporal decay
│   ├── embeddings.ts              ← Ollama embedding client
│   ├── vector-search.ts           ← Semantic search + RRF hybrid ranking
│   ├── learning.ts                ← 7 learning mechanisms
│   ├── ingest/                    ← Content type handlers
│   │   ├── detect.ts              ← URL/path type classifier
│   │   ├── slug.ts                ← Title → filesystem-safe slug
│   │   ├── youtube.ts             ← yt-dlp + json3 transcript
│   │   ├── blog.ts                ← readability + jsdom extraction
│   │   ├── reddit.ts              ← .json API + three-tier fallback
│   │   ├── pdf.ts                 ← PDF download/copy
│   │   ├── audio.ts               ← Whisper local transcription
│   │   └── transcript-clean.ts    ← json3 → clean paragraphs
│   └── extract/
│       └── write-insights.ts      ← JSON → batch insight file creation
├── ingest.ts                      ← CLI: universal URL/file ingestion
├── extract.ts                     ← CLI: JSON → batch insight files
├── compress.ts                    ← CLI: insight compression prompts
├── create-principles.ts           ← CLI: batch principle file creation
├── post-ingest.ts                 ← Pipeline orchestrator
├── reindex.ts                     ← Rebuild all indices
├── health.ts                      ← Validate all frontmatter
├── embed.ts                       ← Generate/update embeddings
├── learn.ts                       ← Run learning mechanisms
├── search.ts                      ← CLI search interface
├── mindmap.ts                     ← Generate markmap visualization
├── views.ts                       ← Generate filtered views
├── resurface.ts                   ← Spaced resurfacing digest
├── archive.ts                     ← Intelligent forgetting
├── resurrect.ts                   ← Un-archive insights
├── sleep.ts                       ← Save session state
└── wake.ts                        ← Morning briefing
```

## The 7 Learning Mechanisms

| # | Mechanism | What it Does |
|---|-----------|-------------|
| 1 | **Connection Discovery** | Finds top-5 semantically similar insights, populates `related[]` bidirectionally |
| 2 | **Emergence Detection** | Flags topics with high insight-to-principle ratios for compression |
| 3 | **Confidence Propagation** | Increases confidence when independent sources corroborate (with echo chamber dampening) |
| 4 | **Semantic Clustering** | Louvain community detection on pruned KNN graph — discovers cross-topic clusters |
| 5 | **Gap Detection** | L2-normalized topic centroids find sparse areas adjacent to dense ones |
| 6 | **Cross-Domain Transfer** | Finds principles that apply to other domains (zero-tag-overlap surprise filter) |
| 7 | **Tension Detection** | Flags contradictory insights via opposing heuristic keywords for Claude to resolve |

All mechanisms run every ingestion via `npm run learn`. Flags are written to `meta/flags.md`.

## Design Philosophy

- **Claude is the reasoning engine** — no external LLM APIs for analysis
- **TypeScript handles the mechanical work** — fetching, cleaning, file creation, validation, vector math
- **The file system is the database** — markdown + YAML frontmatter, git-tracked, human-readable
- **The hierarchy IS the navigation** — tiered indices for logarithmic query cost
- **The system learns, not just stores** — 7 automated mechanisms discover structure in knowledge
- **Compression over accumulation** — insights compress into principles compress into mental models
- **Local-first** — Ollama for embeddings, Whisper for transcription, SQLite for search. Zero cloud dependencies.

## Stats

- 109 insights across 6 domains, 19 topics
- 14 principles, 4 mental models
- 18 sources (Reddit, YouTube, paste)
- 214 automated tests across 15 test files
- 20 TypeScript scripts
- Hybrid search (keyword + 768-dim semantic vectors)
- 7 learning mechanisms
- Zero external API dependencies

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Knowledge files | Markdown + YAML frontmatter |
| Validation | Zod |
| Database | SQLite + FTS5 + sqlite-vec |
| Embeddings | Ollama (nomic-embed-text, 768 dims) |
| Transcription | Whisper (local) |
| Scripts | TypeScript (tsx) |
| Tests | Vitest |
| Article extraction | jsdom + @mozilla/readability |
| Graph analysis | graphology + Louvain |
| Mindmap | Markmap |
| Reasoning | Claude (in conversation) |

## Design Specs

- [Brain Engine Architecture](docs/superpowers/specs/2026-03-19-brain-engine-design.md) — the original 860-line design document
- [Universal Ingestion Pipeline](docs/superpowers/specs/2026-03-20-universal-ingestion-design.md) — Phase 6-7 spec
- [Learning Mechanisms 4-6](docs/superpowers/specs/2026-03-21-learning-mechanisms-4-6-design.md) — Phase 8 spec (the Neocortex)

---

Built by Jin Choi + Claude.
