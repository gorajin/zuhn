# Brain Engine

A personal knowledge operating system that ingests any content, extracts every actionable insight via Claude, and continuously gets smarter.

**Not a note-taking app. Not a bookmark manager. A brain.**

## What it does

You feed it content — Reddit posts, YouTube transcripts, blog posts, convention talks — and it:

1. **Extracts** every discrete, actionable insight
2. **Organizes** them into a 5-level compression hierarchy (raw sources → insights → principles → mental models)
3. **Searches** via hybrid keyword + semantic search (SQLite FTS5 + Ollama embeddings)
4. **Learns** — auto-discovers connections, detects when topics are ready for compression, propagates confidence across sources
5. **Visualizes** as an interactive zoomable mindmap

## The 5 Levels of Knowledge

```
Level 5: MENTAL MODELS        — Transferable frameworks across domains
Level 4: PRINCIPLES           — Synthesized rules backed by evidence
Level 3: INSIGHTS             — Individual knowledge cards (74 and growing)
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

# Run the pipeline (validates + indexes + embeds)
npx tsx scripts/post-ingest.ts

# Search your knowledge
npx tsx scripts/search.ts "reduce AI costs"
npx tsx scripts/search.ts "planning" --hybrid
npx tsx scripts/search.ts "hooks" --domain ai-development

# View the mindmap
open knowledge-base/views/mindmap.html

# Health check
npx tsx scripts/health.ts
```

## Architecture

```
knowledge-base/                    ← Source of truth (markdown + YAML frontmatter)
├── MASTER_INDEX.md                ← Boot file — read this first
├── domains/{domain}/{topic}/*.md  ← Insight files (Zod-validated)
├── sources/reddit/*.md            ← Where insights came from
├── tags/*.md                      ← Cross-reference indices
├── views/mindmap.html             ← Interactive mindmap
└── meta/                          ← System metadata

scripts/                           ← TypeScript tooling
├── schemas/frontmatter.ts         ← Zod schemas for all frontmatter types
├── lib/
│   ├── parse-insight.ts           ← gray-matter + Zod parser
│   ├── generate-id.ts             ← Stateless ULID-inspired IDs
│   ├── generate-index.ts          ← Builds all hierarchical indices
│   ├── db.ts                      ← SQLite + FTS5 database manager
│   ├── search.ts                  ← FTS5 keyword search + temporal decay
│   ├── embeddings.ts              ← Ollama embedding client
│   └── vector-search.ts           ← Semantic search + RRF hybrid ranking
├── reindex.ts                     ← Rebuild all indices
├── health.ts                      ← Validate all frontmatter
├── embed.ts                       ← Generate/update Ollama embeddings
├── search.ts                      ← CLI search interface
├── mindmap.ts                     ← Generate markmap visualization
└── post-ingest.ts                 ← Pipeline orchestrator
```

## Design Philosophy

- **Claude is the reasoning engine** — no external LLM APIs for analysis
- **The file system is the database** — markdown + YAML frontmatter, git-tracked, human-readable
- **The hierarchy IS the navigation** — tiered indices for logarithmic query cost
- **The system learns, not just stores** — automated connection discovery, confidence propagation, gap detection
- **Compression over accumulation** — insights compress into principles compress into mental models

## What's Implemented

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Knowledge base structure, Zod schemas, reindex pipeline | Done |
| 2 | Interactive mindmap (markmap) | Done |
| 3 | SQLite + FTS5 keyword search | Done |
| 4 | Ollama embeddings + semantic hybrid search (RRF) | Done |
| 5 | Learning mechanisms (auto-connections, emergence, confidence) | Next |
| 6-14 | YouTube ingestion, compression passes, tension map, forgetting, and more | Planned |

## What's Planned

- **6 learning mechanisms**: auto-connection discovery, principle emergence detection, confidence propagation, semantic clustering, gap detection, cross-domain transfer
- **Tension map**: track contradictions between insights with resolutions
- **Intelligent forgetting**: archive outdated/low-value insights, reinforce frequently accessed ones
- **YouTube/blog/PDF ingestion**: feed it any content source
- **Spaced resurfacing**: daily digest of insights you haven't seen in a while

## Stats

- 74 insights across 5 domains, 13 topics
- 14 source files from Reddit
- 126 automated tests
- Hybrid search (keyword + 768-dim semantic vectors)
- Zero external API dependencies (Ollama runs locally)

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Knowledge files | Markdown + YAML frontmatter |
| Validation | Zod |
| Database | SQLite + FTS5 + sqlite-vec |
| Embeddings | Ollama (nomic-embed-text, 768 dims) |
| Scripts | TypeScript (tsx) |
| Tests | Vitest |
| Mindmap | Markmap |
| Reasoning | Claude (in conversation) |

## Full Design Spec

See [docs/superpowers/specs/2026-03-19-brain-engine-design.md](docs/superpowers/specs/2026-03-19-brain-engine-design.md) for the complete 860-line architecture document.

---

Built by Jin Choi + Claude.
