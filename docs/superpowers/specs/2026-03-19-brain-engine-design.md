# Brain Engine: Personal Knowledge Operating System

**Date:** 2026-03-19
**Status:** Approved
**Author:** Jin Choi + Claude

---

## Executive Summary

A personal knowledge operating system that ingests any content (Reddit posts, YouTube videos, blog posts, convention panels), extracts every actionable insight via Claude-in-conversation, stores them in a 5-level compression hierarchy, enables semantic search via local embeddings, and continuously gets smarter through 6 automated learning mechanisms. The system uses Claude as the reasoning engine (no external LLM API for analysis), keeps all knowledge as human-readable markdown files on disk, and provides an interactive mindmap as the primary view.

---

## Problem Statement

1. **Saved content is dead content.** Reddit saves, YouTube bookmarks, and article bookmarks accumulate but are never reviewed, organized, or synthesized into actionable knowledge.
2. **Individual tips don't compound.** 500 well-organized tips is only marginally better than 300. Without compression into principles and mental models, knowledge doesn't become expertise.
3. **Context windows are finite.** Any AI-powered knowledge system must scale query cost with answer size, not knowledge base size. Otherwise it breaks at scale.
4. **Existing tools store but don't learn.** OpenClaw has excellent retrieval (hybrid vector + keyword search, temporal decay, MMR). But it stores flat chunks — no compression, no synthesis, no cross-domain transfer, no gap detection.

---

## Design Philosophy

- **Claude is the reasoning engine.** No external LLM APIs for analysis. The user converses with Claude, who reads/writes the knowledge base.
- **The file system is the database.** All knowledge lives as markdown files with YAML frontmatter. Human-readable, git-trackable, portable.
- **The hierarchy IS the navigation.** A tiered index system ensures query cost scales logarithmically with knowledge base size.
- **The system learns, not just stores.** Six automated mechanisms discover connections, propose abstractions, propagate confidence, detect gaps, and transfer principles across domains.
- **Compression over accumulation.** Raw information gets progressively distilled into insights, principles, and mental models. Each level compresses the one below.

---

## The Five Levels of Knowledge

```
Level 5: MENTAL MODELS           ~20-30 total
         Transferable frameworks that apply across domains
         "AI tool quality = structure x context x validation"

Level 4: PRINCIPLES              ~100-200 total
         Synthesized rules supported by evidence
         "Enforce patterns via hooks, not documentation"

Level 3: INSIGHTS                ~500+ total
         Individual knowledge cards with why + how
         "Use UserPromptSubmit hook to inject skill reminders"

Level 2: PROCESSED SOURCES       ~50-200 total
         Summarized, tagged, filed original content

Level 1: RAW INTAKE              unlimited
         Original content exactly as received
```

Each level compresses the one below. Query cost:

| Need | Levels Read | Context Cost |
|------|------------|--------------|
| Quick answer | Level 5 mental models | ~500 lines |
| Detailed answer | L5 + relevant L4 principles | ~800 lines |
| Specific how-to | L5 → L4 → relevant L3 insights | ~1,200 lines |
| Source verification | Drill into L2 + L1 | ~2,000 lines |

Even with 10,000 insights, expert-level answers cost ~800 lines of context.

---

## File Architecture

```
knowledge-base/
│
├── MASTER_INDEX.md                 <- Boot file (~100 lines, always read first)
│
├── mental-models/                  <- Level 5
│   ├── _index.md                   <- All models, one line each
│   ├── enforcement-principle.md
│   ├── context-persistence.md
│   └── cost-quality-frontier.md
│
├── principles/                     <- Level 4
│   ├── _index.md
│   └── {domain}/{principle}.md
│
├── domains/                        <- Level 3: insights
│   ├── {domain}/
│   │   ├── _overview.md            <- Topics + stats (~50-100 lines)
│   │   └── {topic}/
│   │       ├── _summary.md         <- Insight headlines (~30-50 lines)
│   │       └── {insight}.md        <- Full insight w/ 3 resolutions
│   └── .../
│
├── tensions/                       <- Contradictions + resolutions
│   ├── _index.md
│   └── {tension-id}.md
│
├── sources/                        <- Level 1-2: raw + processed
│   ├── _index.md
│   ├── reddit/
│   ├── youtube/
│   ├── blogs/
│   └── panels/
│
├── tags/                           <- Cross-reference routing
│   ├── _index.md
│   └── {tag-name}.md
│
├── archive/                        <- Intelligent forgetting
│   ├── superseded/
│   ├── outdated/
│   ├── low-value/
│   └── graveyard/                  <- User-marked-wrong insights
│
├── meta/
│   ├── stats.md                    <- Health dashboard + ID counters
│   ├── pending.md                  <- Session recovery (unfinished work)
│   ├── stale.md                    <- Time-sensitive insights needing review
│   ├── activity.md                 <- Recent ingestion log
│   ├── flags.md                    <- Learning layer flags for Claude
│   ├── source-trust.md             <- Source reliability scores
│   └── compression-log.md          <- When was last compression pass?
│
├── views/
│   ├── mindmap.md                  <- Generated from one_line resolutions
│   └── mindmap.html                <- Markmap self-contained viewer
│
├── db/
│   └── brain.db                    <- SQLite with FTS5 + sqlite-vec
│
└── scripts/
    ├── reindex.ts                  <- Scan insights, rebuild all indices
    ├── embed.ts                    <- Generate/update embeddings
    ├── learn.ts                    <- Run learning mechanisms
    ├── mindmap.ts                  <- Generate mindmap view
    ├── health.ts                   <- Validate consistency
    └── post-ingest.ts              <- Orchestrator: runs reindex + embed + learn in sequence
```

---

## Insight File Format

Every insight carries structured metadata as YAML frontmatter. Indices are GENERATED from these files (single source of truth).

```yaml
---
id: INS-260319-A7F2
domain: ai-development
topic: claude-code
subtopic: skills-system
title: "Use hooks to force-activate skills"
actionability: immediate          # immediate | reference | inspiration
confidence: high                  # pending | low | medium | high | very_high
shelf_life: evergreen             # evergreen | time-sensitive
status: active                    # active | outdated | superseded | applied
tags: [hooks, skills, automation, context-management]
sources:
  - type: reddit
    title: "Claude Code is a Beast"
    author: u/diet103
    url: https://reddit.com/r/ClaudeCode/...
  - type: reddit
    title: "Claude Code usage limit hack"
    author: u/PaschalisDim
related: [INS-260319-B3C8, INS-260319-D4E7]  # auto-populated by embedding similarity
date_extracted: 2026-03-19
last_accessed: null
access_count: 0
indexed: false                    # set true by reindex.ts
embedded: false                   # set true by embed.ts
resolutions:
  one_line: "Force-activate skills via hooks -- Claude won't use them voluntarily"
  standard: |
    Claude ignores skills unless hooks enforce activation. Build a
    UserPromptSubmit hook that analyzes prompts and injects skill
    reminders. Add a Stop hook for post-response self-checks.
    Why: Skills are "expensive decorations" without enforcement.
    Result: Consistent code patterns, 40-60% token savings.
  deep: |
    [Full technical walkthrough with code examples, configuration,
     the skill-rules.json format, restructuring tips, edge cases,
     related insights inline, user annotations, source excerpts]
---

[Standard resolution content displayed by default when file is read]
```

---

## Principle File Format (Level 4)

```yaml
---
id: PRI-0008
domain: ai-development
title: "Enforce patterns via hooks, not documentation"
summary: "Passive documentation gets ignored. Structural enforcement via hooks ensures compliance."
confidence: very_high
supporting_insights: [INS-260319-A7F2, INS-2026-0044, INS-260319-D4E7]
supporting_count: 3
tags: [enforcement, hooks, patterns, automation]
date_created: 2026-03-19
last_reviewed: 2026-03-19
resolutions:
  one_line: "Enforce patterns via hooks, not documentation"
  standard: |
    Three independent sources confirm: Claude ignores skills docs,
    code patterns drift without build hooks, specs work only when
    required as inputs. The common pattern: structural enforcement
    always beats passive documentation.
---

[Standard resolution content with evidence summary]
```

---

## Mental Model File Format (Level 5)

```yaml
---
id: MM-003
title: "The Enforcement Principle"
core_statement: "Systems follow guidelines only when compliance is structurally enforced, not documented or requested."
domains: [ai-development, automation, music-production]
supporting_principles: [PRI-0008, PRI-0012, PRI-0019]
supporting_count: 3
confidence: very_high
transferable: true
date_created: 2026-03-19
last_reviewed: 2026-03-19
resolutions:
  one_line: "Systems follow guidelines only when structurally enforced"
  standard: |
    Across AI development, automation, and creative workflows,
    the pattern is identical: structured enforcement prevents
    10x more rework than documentation alone. Hooks > docs.
    Templates > instructions. Constraints > guidelines.
---

[Full mental model with evidence from all domains, applications, and counter-examples]
```

---

## ID Generation

IDs are **stateless and timestamp-based** to avoid the hallucination risk of Claude tracking sequential counters. Format uses ULID-inspired prefixed timestamps:

- Insights: `INS-{YYMMDD}-{4-char-hex}` (e.g., `INS-260319-A7F2`)
- Principles: `PRI-{YYMMDD}-{4-char-hex}` (e.g., `PRI-260319-B1C4`)
- Mental Models: `MM-{YYMMDD}-{4-char-hex}` (e.g., `MM-260319-D3E5`)
- Tensions: `T-{YYMMDD}-{4-char-hex}` (e.g., `T-260319-F6A1`)

The hex suffix is generated by Claude using the last 4 chars of a hash of the insight title, ensuring uniqueness without needing to read or write any central counter. File creation is completely stateless and conflict-free.

`meta/stats.md` still tracks total counts (generated by `reindex.ts`) for the MASTER_INDEX, but is never used for ID generation.

---

## Source Trust Tracking

`meta/source-trust.md` tracks reliability of content sources:

```markdown
## Source Reliability Scores

| Source | Type | Insights | Corroboration Rate | Trust |
|--------|------|----------|-------------------|-------|
| r/ClaudeCode | reddit | 34 | 0.72 | high |
| r/n8n | reddit | 18 | 0.65 | high |
| u/diet103 | author | 28 | 0.80 | very_high |
| r/LocalLLaMA | reddit | 5 | 0.40 | medium |
```

Generated by `scripts/reindex.ts` from insight frontmatter. Trust scores are derived from corroboration rate (how often insights from this source are confirmed by other sources).

---

## Execution Model

All scripts run via Claude's Bash tool in Claude Code sessions. The runtime environment is Node.js with `tsx` for TypeScript execution.

**Post-ingestion orchestrator** (`scripts/post-ingest.ts`):
Claude runs a single command after extracting insights:
```bash
npx tsx scripts/post-ingest.ts
```

This orchestrator executes in sequence with error handling:
1. `health.ts` — validate all frontmatter (Zod), catch malformed files early
2. `reindex.ts` — rebuild all structural indices
3. `embed.ts` — generate embeddings for new/modified content
4. `learn.ts` — run learning mechanisms
5. Auto-git: `git add knowledge-base/ && git commit -m "Auto: processed indices and learning mechanisms"`
6. Report results and any failures to stdout

The auto-git step provides an instant undo button — if Claude accidentally overwrites a mental model during a reasoning pass, `git revert` recovers it in seconds.

Each step is wrapped in try/catch. On failure:
- The step is logged to `meta/activity.md` with the error
- Subsequent steps still run (they're independent)
- `scripts/health.ts` can detect inconsistencies later

**Access tracking:** When Claude reads an insight file during a query, Claude updates `last_accessed` and increments `access_count` in the YAML frontmatter before responding. This is an explicit instruction in `MASTER_INDEX.md`:
```
NOTE: When reading insight files to answer queries, update
last_accessed to today's date and increment access_count.
```

**File watcher (recommended):** To avoid relying on Claude to remember to run `post-ingest.ts`, a lightweight file watcher daemon using `chokidar` can run in the background. When any `.md` file in `knowledge-base/domains/` or `knowledge-base/sources/` is created or modified, the watcher auto-triggers `post-ingest.ts`. This takes the orchestration burden off Claude entirely.

```bash
# Start the watcher in background (optional)
npx tsx scripts/watch.ts &
```

**Context bloat protocol:** After an ingestion session (processing a long transcript, multiple posts), Claude's context window is bloated with raw source text. Before switching to reasoning tasks (compression passes, tension analysis, queries), the conversation MUST be compacted. Protocol:
1. Finish ingestion → run `post-ingest.ts` (or watcher auto-runs it)
2. Update `meta/pending.md` if work remains
3. Compact the conversation or start a new session
4. In the new session, read `MASTER_INDEX.md` + `meta/flags.md` → reason from the clean knowledge base, not the raw source text

**Fallback if scripts can't run:** The knowledge base functions without scripts — Claude can manually navigate via Read/Grep tools and the hierarchical index. Scripts add automation; they're not required for basic operation.

---

## Database Schema

`db/brain.db` contains three tables:

```sql
-- Core insights table (mirrors frontmatter for fast queries)
CREATE TABLE insights (
  id TEXT PRIMARY KEY,           -- e.g., 'INS-260319-A7F2'
  domain TEXT NOT NULL,
  topic TEXT NOT NULL,
  subtopic TEXT,
  title TEXT NOT NULL,
  one_line TEXT NOT NULL,
  confidence TEXT DEFAULT 'pending',
  status TEXT DEFAULT 'active',
  shelf_life TEXT DEFAULT 'evergreen',
  actionability TEXT DEFAULT 'reference',
  file_path TEXT NOT NULL,       -- relative path to .md file
  content_hash TEXT NOT NULL,    -- SHA-256 of one_line (for change detection)
  embedding_model TEXT,          -- which model generated the embedding
  date_extracted TEXT,
  last_accessed TEXT,
  access_count INTEGER DEFAULT 0
);

-- Full-text search (BM25 ranking built-in)
CREATE VIRTUAL TABLE insights_fts USING fts5(
  id,
  title,
  one_line,
  tags,                          -- space-separated tag list
  content='insights',
  content_rowid='rowid'
);

-- Vector embeddings (cosine similarity)
CREATE VIRTUAL TABLE embeddings USING vec0(
  id TEXT PRIMARY KEY,           -- matches insights.id
  embedding FLOAT[768]           -- nomic-embed-text dimensions
);
```

**Embedding model tracking:** The `embedding_model` column in `insights` records which model generated the embedding. If `embed.ts` detects a model mismatch (user switched Ollama models), it flags all mismatched entries for re-embedding and warns via stdout.

**Principles and mental models** get separate tables with the same structure (or share the `insights` table with a `level` column — implementation detail for Phase 3).

---

## MASTER_INDEX.md Structure

The boot file, always read at session start (~100 lines max):

```markdown
# Knowledge Base Master Index
Last rebuilt: 2026-03-19 | Total insights: 147 | Sources: 23

## Domains
| Domain | Topics | Insights | Principles | Last Updated |
|--------|--------|----------|-----------|-------------|
| ai-development | 6 | 52 | 8 | 2026-03-19 |
| automation | 4 | 28 | 4 | 2026-03-18 |
| music-production | 3 | 12 | 1 | 2026-03-15 |
| video-production | 2 | 8 | 1 | 2026-03-10 |

## Mental Models
- enforcement-principle: "Systems follow guidelines only when structurally enforced"
- context-persistence: "Limited-memory systems lose goals without externalized artifacts"
- cost-quality-frontier: "Pre-filtering cheap inputs before expensive processing maximizes value"

## Top Tags
cost-optimization(15) hooks(12) planning(11) claude-code(34)
n8n(18) prompting(9) streaming(6) ...

## Flags (for Claude)
- COMPRESS: ai-development/claude-code has 12:0 insight:principle ratio
- STALE: 3 time-sensitive insights older than 90 days
- TRANSFER: enforcement-principle has 0.78 similarity to music-production insights

## Recently Added (last 7 days)
- INS-0142: "Use yt-dlp to grab transcripts..." [automation/youtube]
- ...
```

---

## Navigation Algorithm

### Hierarchical Path (structured queries)
```
Read MASTER_INDEX.md (100 lines)
  -> Identify relevant domain(s)
Read domain _overview.md (50-100 lines)
  -> Identify relevant topic(s)
Read topic _summary.md (30-50 lines)
  -> Identify relevant insight(s)
Read specific insight files (30-50 lines each)
Total: ~300-800 lines for any query
```

### Semantic Path (unstructured queries)
```
Embed query -> hybrid search (vector + BM25) across all insights
  -> Apply temporal decay weighting
  -> Apply MMR for diversity
  -> Return top-10 ranked results
Total: ~500 lines
```

### Combined Path (Brain Engine default)
```
1. Read relevant mental models (~100 lines)
   -> Framework for reasoning
2. Semantic search for unexpected connections (~200 lines)
   -> Catches what hierarchy might miss
3. Drill into specific insights where needed (~300 lines)
   -> Detail on demand
Total: ~600 lines for expert-level answer at any scale
```

---

## Semantic Index (Layer 1)

### Technology: SQLite + FTS5 + sqlite-vec

**Why SQLite:** Local-first, zero config, single file, battle-tested. No external database needed.

**FTS5 (Full-Text Search 5):** Built into SQLite. BM25 ranking out of the box. Handles keyword search without any external dependency.

**sqlite-vec:** SQLite extension for vector operations. Stores embeddings and computes cosine similarity. Enables semantic search.

### Embedding Strategy

**Provider:** Ollama running locally (no external API, fully private). Fallback: FTS5-only mode if Ollama isn't installed.

**What gets embedded:**
- Every insight's `one_line` resolution
- Every principle's title + summary
- Every mental model's core statement
- Tag descriptions

**Embedding is incremental:** Only new/modified content gets re-embedded. The `embed.ts` script tracks what's been embedded via a hash of the content.

### Hybrid Search Formula

Uses Reciprocal Rank Fusion (RRF) to avoid score normalization issues between vector similarity [0,1] and unbounded BM25 scores:
```
final_score = 1/(k + rank_vector) + 1/(k + rank_bm25)
k = 60 (standard RRF constant)
```
If an insight appears in only one result set, the missing rank defaults to `total_results + 1`. RRF is robust to score scale differences and well-studied in information retrieval.

### Temporal Decay
```
decayed_score = score x e^(-lambda x age_days)
lambda = ln(2) / half_life_days    (default half_life = 60 days)
```
- Evergreen insights (shelf_life: evergreen): bypass decay
- Accessed insights: decay timer resets on access (reinforcement)
- Time-sensitive insights: decay at 2x rate after shelf_life exceeded

### MMR (Maximal Marginal Relevance)
```
MMR = 0.7 x relevance - 0.3 x max_similarity_to_selected
```
Ensures top-10 results are diverse, not redundant.

### Query Expansion
Before searching, extract additional keywords:
- Tokenize query, remove stop words
- **Embedding-based expansion:** Embed the query, find the 5 nearest tags in the embedding space, add those tag names as additional search terms. This works with embedding-only Ollama (no generative model needed).
- **Fallback (no Ollama):** Use the tag index to find tags that co-occur with query terms, add those as expansions.

---

## Six Learning Mechanisms (Layer 2)

All implemented in `scripts/learn.ts`, run after every ingestion session.

### 1. Automatic Connection Discovery
**Trigger:** New insight ingested
**Action:** Embed new insight, cosine-similarity against all existing embeddings. Top-5 matches auto-populate the `related` field in the new insight's frontmatter. Bidirectional: also add to related insights' `related` fields.
**Output:** Updated frontmatter on affected insight files.

### 2. Principle Emergence Detection
**Trigger:** Topic insight:principle ratio exceeds 5:1
**Action:** Add flag to `meta/flags.md`: "COMPRESS: {domain}/{topic} has {N} insights, {M} principles"
**Output:** Flag for Claude to process during next reasoning session.

### 3. Confidence Propagation
**Trigger:** New insight has >0.85 cosine similarity to existing insight from a different source
**Action:** Increase confidence on both insights. Update source reliability score in `meta/source-trust.md`.

**Transition rules:**
- `pending -> low`: 0 corroborations (default after extraction)
- `low -> medium`: 1 corroboration from any source
- `medium -> high`: 2 corroborations from distinct source types (e.g., reddit + youtube)
- `high -> very_high`: 3+ corroborations from distinct source types

**Echo chamber dampening:** Corroboration from the same platform AND same community (e.g., two r/ClaudeCode posts) counts as 0.5x weight. Content reposting is common on Reddit; cross-platform or cross-community confirmation is stronger evidence.

**Negative propagation:** If a source is later found unreliable, all insights solely sourced from it get confidence reduced by one level. Insights with multiple independent sources are unaffected.

**Output:** Updated frontmatter confidence fields.

### 4. Semantic Clustering (Topic Discovery)
**Trigger:** Periodic (after every 20 new insights)
**Action:** Run DBSCAN on embedding space using cosine distance (1 - cosine_similarity). Parameters: `eps = 0.25` (similarity > 0.75 to be neighbors), `min_samples = 3`. Identify clusters of 3+ insights that don't share a topic.

**Implementation:** sqlite-vec doesn't support DBSCAN natively. Due to the curse of dimensionality (distance metrics homogenize in 768-dimensional space, causing a fixed `eps` to produce either one massive cluster or all noise), `learn.ts` must:
1. Pull all embeddings into memory
2. Apply dimensionality reduction (UMAP to ~10 dimensions) before clustering
3. Run DBSCAN on the reduced space using `density-clustering` npm package

Alternative approach if UMAP adds too much complexity: build a K-Nearest Neighbors (KNN) graph from cosine similarities and use Louvain community detection, which relies on relative graph density rather than absolute distance thresholds. This is more robust in high-dimensional spaces.

Both approaches are feasible for personal-scale knowledge bases (10,000 embeddings at 768 dimensions is ~30MB in memory).

**Output:** Flag for Claude: "DISCOVER: {N} insights form natural cluster, suggested topic: {name}"

### 5. Gap Detection
**Trigger:** Periodic (after every 20 new insights)
**Action:** Analyze embedding density by domain. Identify sparse regions adjacent to dense ones. Cross-reference with tags.
**Output:** `meta/flags.md` entry: "GAP: You have 34 insights about {X} but 0 about closely related {Y}"

### 6. Cross-Domain Transfer
**Trigger:** Periodic (after new principles created)
**Action:** Embed all principles. For each principle, find top-3 similar insights in OTHER domains. If similarity > 0.75, flag.
**Output:** `meta/flags.md`: "TRANSFER: {principle} may apply to {domain}/{topic} (similarity: 0.78)"

---

## Tension Map (Contradictions)

File format: `tensions/{tension-id}.md`

```yaml
---
id: T-001
title: "Model Quality vs. Cost"
status: resolved_with_nuance    # unresolved | resolved | resolved_with_nuance
side_a: [INS-0012, INS-0044]
side_b: [INS-0031, INS-0033]
resolution: [INS-0035]
---

**Side A:** "Use the best model to ensure quality"
**Side B:** "Cheap models produce identical quality for most tasks"
**Resolution:** Task-dependent. Creative/reasoning = expensive.
Classification/filtering = cheap.
```

Tensions are discovered by the learning layer (high-similarity insights with opposing sentiment/direction) and resolved by Claude during reasoning sessions.

---

## Intelligent Forgetting

### Archive Rules
- `shelf_life: time-sensitive` + not accessed in 90 days -> `archive/outdated/`
- Superseded by newer insight with higher confidence -> `archive/superseded/`
- `confidence: low` + `access_count: 0` + age > 180 days -> `archive/low-value/`
- User explicitly marks as wrong -> `archive/graveyard/`

### Reinforcement
- Every time an insight is read/cited: `access_count += 1`, `last_accessed` updated
- Temporal decay timer resets on access
- Frequently accessed insights effectively become evergreen through use

Archive is still searchable but excluded from default indices. Active knowledge base stays lean.

---

## Ingestion Pipeline

### Content Types Supported

| Content Type | Ingestion Method | Processing |
|---|---|---|
| Reddit posts | WebFetch URL (prefer old.reddit.com or .json) | Claude extracts insights |
| Reddit comments | WebFetch {url}.json for comment data | Claude extracts insights |
| Blog posts / articles | WebFetch URL (fallback: user pastes) | Claude extracts insights |
| YouTube videos | yt-dlp transcript download | Claude extracts insights |
| Pasted text | Direct in conversation | Claude extracts insights |
| Files in inbox/ | Claude reads with Read tool | Claude extracts insights |
| PDFs | Claude reads with Read tool | Claude extracts insights |
| Audio (future) | Whisper local transcription | Claude extracts insights |

### Ingestion Workflow
```
1. Content arrives (URL, paste, file)
2. Fetch/read raw content -> save to sources/{type}/{slug}.md
3. Claude reads and extracts insights
4. Each insight written as {insight}.md with full frontmatter
   (includes indexed: false, embedded: false in frontmatter)
5. Claude runs: npx tsx scripts/post-ingest.ts
   5a. reindex.ts -> sets indexed: true on processed insights
   5b. embed.ts -> sets embedded: true on processed insights
   5c. learn.ts -> runs learning mechanisms
   Each step has try/catch; failures logged to meta/activity.md
   but don't block subsequent steps.
6. Update meta/activity.md with ingestion log
7. If pending work remains, update meta/pending.md
```

**Pipeline status tracking:** Each insight has `indexed` and `embedded` boolean fields in frontmatter. `scripts/health.ts` detects insights where either is false and flags them for retry. This handles interrupted sessions gracefully.

### Session Recovery
If a session ends mid-ingestion:
```yaml
# meta/pending.md
source: "AI Agent Architecture Talk (YouTube)"
status: 8/15 insights extracted
remaining: "timestamps 32:15 - 47:00 not yet processed"
source_file: sources/youtube/ai-agent-architecture.md
```
Next session: Claude reads `pending.md` and picks up exactly where stopped.

---

## Views

### Mindmap (Primary View)
Generated by `scripts/mindmap.ts`:
- Reads all insight `one_line` resolutions
- Organizes by domain -> topic hierarchy
- Outputs `views/mindmap.md` (markmap-compatible markdown)
- Outputs `views/mindmap.html` (self-contained viewer with markmap CDN)
- Expandable/collapsible nodes, pan, zoom
- Click any node to see source link

**Scalability:** Markmap degrades past ~200-300 visible nodes. To handle larger knowledge bases:
- **Default view:** Domains + topics only (collapsed). Insights hidden until a topic is expanded. This keeps visible nodes under 100 even at 1,000+ insights.
- **Per-domain views:** `scripts/mindmap.ts` also generates `views/mindmap-{domain}.md` for each domain, showing full insight-level detail within that domain.
- **Max leaf nodes per view:** 200. If a topic has >50 insights, show top-20 by confidence + "and N more..."

### Additional Views (Generated on Demand)
- **Action List:** Filter by `actionability: immediate` + `status: active`
- **Stale Board:** Time-sensitive insights past review date
- **Source Map:** Sources ranked by insight density and reliability
- **Gap Report:** Domains and topics with coverage gaps

---

## Scripts

### scripts/reindex.ts
Scans all insight files, parses YAML frontmatter, rebuilds:
- MASTER_INDEX.md
- All _overview.md files
- All _summary.md files
- All tag index files
- meta/stats.md
Run after every ingestion session. Deterministic, fast.

### scripts/embed.ts
For each insight/principle/mental-model:
- Hash content, check if embedding exists
- If new/changed: generate embedding via Ollama
- Store in db/brain.db (sqlite-vec)
- Update FTS5 index
Incremental: only processes new/modified content.

### scripts/learn.ts
Runs all 6 learning mechanisms:
1. Connection discovery (new insights only)
2. Principle emergence detection
3. Confidence propagation
4. Semantic clustering (if 20+ new insights since last run)
5. Gap detection (if 20+ new insights since last run)
6. Cross-domain transfer (if new principles since last run)
Outputs flags to meta/flags.md for Claude's next reasoning session.

### scripts/mindmap.ts
Generates views/mindmap.md and views/mindmap.html from insight one_line resolutions.

### scripts/health.ts
Validates using **Zod schemas** for strict YAML frontmatter validation:
- All insight/principle/mental-model files match their Zod schema (catches `confidence: High` vs `high`, missing required fields, wrong types)
- On validation failure: outputs exact file path and field error to stderr so Claude's Bash tool catches it and can auto-fix immediately
- All referenced IDs exist (no dangling `related` references)
- No orphaned tags
- Index consistency with actual files
- Embedding coverage (% of insights embedded)
- Pipeline status (insights with `indexed: false` or `embedded: false`)

### scripts/watch.ts
Lightweight file watcher using `chokidar`:
- Watches `knowledge-base/domains/`, `knowledge-base/sources/`, `knowledge-base/principles/`, `knowledge-base/mental-models/`
- On `.md` file create/modify: auto-runs `post-ingest.ts` (debounced 5 seconds)
- Removes the burden of remembering to run scripts from Claude

---

## Periodic Maintenance

### After Every Session (Automated)
- `scripts/reindex.ts`
- `scripts/embed.ts`
- `scripts/learn.ts`

### Weekly (Claude in Conversation)
- Review `meta/flags.md` — process COMPRESS, DISCOVER, TRANSFER flags
- Review `meta/stale.md` — verify time-sensitive insights
- Compression pass on flagged topics (insights -> principles)

### Monthly (Claude in Conversation)
- Full compression review (principles -> mental models)
- Tension map review (new contradictions?)
- Gap report review
- Archive pass (prune low-value, outdated content)
- Source reliability assessment

### Quarterly (Claude in Conversation)
- Mental model revision (still accurate? need updating?)
- Full knowledge base health check
- "What have I learned in the last 3 months?" synthesis

---

## Tech Stack

| Component | Technology | Why |
|---|---|---|
| Knowledge files | Markdown + YAML frontmatter | Human-readable, editable, git-trackable |
| Database | SQLite + FTS5 + sqlite-vec | Local-first, zero config, single file |
| Embeddings | Ollama (local) | Private, free, no API key needed |
| Embedding model | nomic-embed-text (via Ollama) | Good quality, runs locally, 768 dimensions |
| Scripts | TypeScript (tsx) | Type safety, runs with Node.js |
| Mindmap renderer | Markmap | Markdown in, interactive mindmap out |
| Version control | Git | Track knowledge evolution |
| Reasoning engine | Claude (in conversation) | No external LLM API |
| Content fetching | WebFetch (Claude Code tool) | Fetches Reddit, blogs, articles |
| Reddit fallback | old.reddit.com or {url}.json | More reliable than modern Reddit UI |
| Clustering | density-clustering (npm) | DBSCAN for topic discovery |
| Schema validation | Zod (npm) | Strict YAML frontmatter validation |
| File watcher | chokidar (npm) | Auto-trigger post-ingest on file changes |
| Fallback (no Ollama) | FTS5-only mode | Still functional without embeddings |

**Note on Obsidian compatibility:** The `knowledge-base/` directory IS a valid Obsidian vault. Opening it in Obsidian provides a free GUI, frontmatter editor, and graph view that complements the terminal-driven workflow. No additional configuration needed — the markdown + YAML structure is natively Obsidian-compatible.

---

## Phase Plan

| Phase | What | Deliverable |
|---|---|---|
| **1** | File structure + reindex script + process Reddit saves | Working knowledge base with insights from Reddit |
| **2** | Mindmap generation (markmap) | Interactive mindmap.html viewer |
| **3** | SQLite + FTS5 search | Keyword search across all insights |
| **4** | Ollama embeddings + sqlite-vec | Semantic hybrid search |
| **5** | Learning mechanisms 1-3 (connections, emergence, confidence) | System starts discovering relationships |
| **6** | YouTube ingestion (yt-dlp) | Process video content |
| **7** | Blog/article ingestion | Full web content support |
| **8** | Learning mechanisms 4-6 (clustering, gaps, transfer) | System discovers structure and gaps |
| **9** | Tension map + contradiction detection | Expertise-level knowledge handling |
| **10** | Compression passes + mental model generation | Full 5-level hierarchy operational |
| **11** | Intelligent forgetting + archive system | Knowledge base stays lean |
| **12** | Additional views (action list, stale board, gap report) | Multiple lenses on knowledge |
| **13** | Audio transcription (Whisper) for panels/talks | Full media support |
| **14** | Spaced resurfacing + daily digest generation | Active recall system |

---

## Success Criteria

1. **Can answer "what do I know about X?" by reading <1,000 lines** regardless of knowledge base size
2. **Discovers connections the user didn't explicitly create** via embedding similarity
3. **Compresses 500 insights into ~30 principles and ~10 mental models** through periodic reasoning passes
4. **Identifies contradictions** and presents both sides with resolutions
5. **Knows what it doesn't know** via gap detection in the embedding space
6. **Transfers principles across domains** without being explicitly told to
7. **All knowledge is human-readable markdown** editable with any text editor
8. **Works offline** — Ollama for embeddings, SQLite for search, files for storage
9. **Session recovery is seamless** — `pending.md` enables pick-up-where-you-stopped
10. **Gets measurably smarter over time** — not just bigger

---

## Comparison with Existing Systems

| Feature | Notion/Obsidian | OpenClaw | Brain Engine |
|---|---|---|---|
| Storage | Rich text / markdown | Vector chunks | 5-level compressed markdown |
| Organization | Manual folders/tags | None (flat vectors) | Auto-hierarchical + semantic |
| Search | Keyword only | Hybrid (vector + BM25) | Hybrid + hierarchical + multi-resolution |
| Learns | No | No | Yes (6 mechanisms) |
| Compresses | No | No | insights -> principles -> mental models |
| Contradictions | No | No | Tension map with resolutions |
| Gap awareness | No | No | Embedding density analysis |
| Cross-domain | No | No | Principle transfer proposals |
| Trust modeling | No | No | Source confidence propagation |
| Human-readable | Yes | No | Yes |
| Offline | Yes | Partially | Fully |
| Gets smarter | No | No | Yes |
