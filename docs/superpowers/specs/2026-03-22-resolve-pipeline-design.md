# Resolve Pipeline — Phase 15 Empirical Engine

> Spec written: 2026-03-22
> Status: Approved for implementation

## Overview

The resolve pipeline closes the feedback loop in Zuhn's knowledge metabolism. When a prediction is confirmed/falsified or a decision succeeds/fails, the pipeline:

1. Updates the record's status and resolution metadata
2. Cascades confidence adjustments to supporting principles and insights
3. Spawns tensions for investigation when outcomes are negative
4. Guards against infinite loops, double-dips, and credit assignment errors

This is implemented as two components:
- **resolve.ts** — thin CLI script that updates status (the "event")
- **Mechanism 8** in learning.ts — asynchronous cascade logic (the "event handler")

This separation keeps the CLI fast and delegates graph traversal to the background pipeline.

---

## 1. resolve.ts — CLI Script

### Interface

```bash
npx tsx scripts/resolve.ts --id <ID> --status <STATUS> --notes <NOTES> [--post-ingest]
```

### Arguments

| Arg | Required | Description |
|-----|----------|-------------|
| `--id` | yes | PRED-XXXXXX-XXXX or DEC-XXXXXX-XXXX |
| `--status` | yes | Target status (see valid transitions below) |
| `--notes` | yes | Explanation of what happened. Required to force reflection. |
| `--post-ingest` | no | Run post-ingest pipeline after resolution |

### Valid Status Transitions

| Record Type | From | To |
|-------------|------|----|
| Prediction | `active` | `confirmed` or `falsified` |
| Decision | `pending` | `success`, `failure`, or `mixed` |

Any other transition errors. Already-resolved records error.

### Frontmatter Changes

resolve.ts ADDS these fields to the existing frontmatter:

```yaml
resolution_date: '2026-06-22'       # date of resolution
resolution_notes: 'explanation...'   # what happened
```

resolve.ts UPDATES this field:

```yaml
status: confirmed   # was: active
```

resolve.ts does NOT set `cascaded` or `empirical_state`. Those are mechanism 8's responsibility.

### File Discovery

Scans `knowledge-base/predictions/*.md` and `knowledge-base/decisions/*.md`. For each file, parses frontmatter and checks `data.id === targetId`. Errors if not found.

### Validation Rules

1. ID must match exactly one file
2. Current status must be `active` (predictions) or `pending` (decisions)
3. Target status must be valid for the record type
4. Notes are required (empty string errors)

---

## 2. Mechanism 8: Empirical Propagation

### Location

New exported function in `scripts/lib/learning.ts`:

```typescript
export async function propagateEmpiricalConfidence(
  db: Database.Database,
  kbRoot: string
): Promise<EmpiricalChange[]>
```

### When It Runs

Called by `learn.ts` after mechanism 7 (tension detection), before flags are written. Runs every time `learn.ts` runs (every post-ingest).

### Idempotency Guard

After processing a resolved prediction/decision, sets `cascaded: true` in its frontmatter. Subsequent runs skip files where `cascaded === true`.

### Return Type

```typescript
export interface EmpiricalChange {
  resolvedId: string;        // PRED- or DEC- ID that triggered this
  resolvedStatus: string;    // confirmed/falsified/success/failure/mixed
  affectedId: string;        // INS- or PRI- ID whose confidence changed
  oldConfidence: string;
  newConfidence: string;
  cascade: 'direct' | 'supporting';  // direct = depth 0, supporting = depth 1
}
```

---

## 3. Cascade Rules

### CRITICAL: Asymmetric Cascading

Success cascades to depth 1 (principle + supporting insights).
Failure cascades to depth 0 ONLY (principle/insight directly cited).

**Rationale:** A principle is a human synthesis. An insight is a concrete fact. A failed synthesis does not invalidate its inputs. Blanket-dropping supporting insights risks triggering intelligent forgetting on valid data. The spawned tension asks Claude to investigate whether the insights or the synthesis was at fault.

### CRITICAL: processedIds Guard (Double-Dip Prevention)

For each resolved prediction/decision, initialize `const processedIds = new Set<string>()`. Before applying any confidence change, check `if (processedIds.has(id)) continue;` then `processedIds.add(id)`.

**Rationale:** The knowledge graph has shared edges. If a decision is `informed_by: [PRI-001, INS-005]` and `INS-005` is also in `PRI-001.supporting_insights`, without this guard `INS-005` would be boosted/dropped twice in one cascade.

### CRITICAL: empirical_state Field (Consensus vs Reality)

When mechanism 8 drops confidence on a node, it sets `empirical_state: "falsified"` in the frontmatter. When mechanism 8 boosts confidence on a node, it sets `empirical_state: "confirmed"`.

Mechanism 3 (structural confidence propagation) is updated to skip any node where `empirical_state === "falsified"`. This prevents structural consensus from overriding empirical evidence.

**Rationale:** Without this, mechanism 3 would re-boost a node that mechanism 8 just dropped, because the structural evidence (3 corroborating sources) hasn't changed. Reality must permanently override consensus until a future positive outcome clears the state.

### Cascade: CONFIRMED Prediction

```
1. Read derived_from: [PRI-XXXXXX-XXXX, ...]
2. For each principle:
   a. Boost confidence one level (cap at very_high)
   b. Set empirical_state: "confirmed"
   c. Add to processedIds
   d. Read principle's supporting_insights: [INS-..., ...]
   e. For each supporting insight (if not in processedIds):
      - Boost confidence one level (cap at very_high)
      - Set empirical_state: "confirmed"
      - Add to processedIds
3. Set cascaded: true on the prediction file
```

### Cascade: FALSIFIED Prediction

```
1. Read derived_from: [PRI-XXXXXX-XXXX, ...]
2. For each principle:
   a. Drop confidence one level (floor at low, never pending)
   b. Set empirical_state: "falsified"
   c. If shelf_life === "evergreen", change to "time-sensitive"
   d. Add to processedIds
   e. Do NOT cascade to supporting insights
3. Spawn tension file (see section 4)
4. Set cascaded: true on the prediction file
```

### Cascade: SUCCESSFUL Decision

```
1. Read informed_by: [INS-XXXXXX-XXXX, PRI-XXXXXX-XXXX, ...]
2. For each INS- ID (if not in processedIds):
   a. Boost confidence one level (cap at very_high)
   b. Set empirical_state: "confirmed"
   c. Add to processedIds
3. For each PRI- ID (if not in processedIds):
   a. Boost confidence one level (cap at very_high)
   b. Set empirical_state: "confirmed"
   c. Add to processedIds
   d. Read principle's supporting_insights
   e. For each supporting insight (if not in processedIds):
      - Boost confidence one level
      - Set empirical_state: "confirmed"
      - Add to processedIds
4. Set cascaded: true on the decision file
```

### Cascade: FAILED Decision

```
1. Read informed_by: [INS-XXXXXX-XXXX, PRI-XXXXXX-XXXX, ...]
2. For each INS- ID (if not in processedIds):
   a. Drop confidence one level (floor at low)
   b. Set empirical_state: "falsified"
   c. If shelf_life === "evergreen", change to "time-sensitive"
   d. Add to processedIds
3. For each PRI- ID (if not in processedIds):
   a. Drop confidence one level (floor at low)
   b. Set empirical_state: "falsified"
   c. If shelf_life === "evergreen", change to "time-sensitive"
   d. Add to processedIds
   e. Do NOT cascade to supporting insights
4. Spawn tension file (see section 4)
5. Set cascaded: true on the decision file
```

### Cascade: MIXED Decision

```
1. No confidence changes
2. No tensions spawned
3. Set cascaded: true on the decision file
```

### Confidence Level Transitions

Boost: `pending → low → medium → high → very_high` (cap at very_high, skip if at cap)
Drop: `very_high → high → medium → low` (floor at low, never to pending)

`pending` means "untested/unprocessed" — a distinct epistemic state from `low` ("empirically weak"). Mechanism 8 never sets `pending`.

---

## 4. Tension Spawning on Failure

### When

Triggered by `falsified` predictions and `failed` decisions. NOT by `mixed` or positive outcomes.

### What It Creates

A tension file in `knowledge-base/tensions/`:

```yaml
---
id: T-XXXXXX-XXXX
title: "Falsified: [prediction claim or decision context]"
type: empirical_failure
status: unresolved
side_a:
  - PRED-XXXXXX-XXXX   # or DEC-
side_b:
  - PRI-XXXXXX-XXXX    # the principle/insight that was wrong
source_principle: PRI-XXXXXX-XXXX
date_created: '2026-10-15'
---

## Context
Prediction [ID] claimed: "[claim text]"
This was falsified on [date]: "[resolution notes]"

Derived from principle [ID]: "[principle title]"

## Questions to Resolve
- Was the principle wrong, or was the prediction too aggressive an extrapolation?
- Did the underlying insights fail, or was the principle a flawed synthesis of correct facts?
- Investigate the supporting insights: [list of INS- IDs]
- Should the principle be revised, narrowed, or retired?
```

### The `type: empirical_failure` Field

Distinguishes from keyword-detected tensions (mechanism 7). Empirical tensions are concrete — a prediction literally failed — not speculative semantic contradictions.

### Deduplication

Before creating, check if a tension already exists with the same `side_a` and `side_b` pair. Uses the same `existingPairs` pattern as mechanism 7.

### ID Generation

Uses existing `generateTensionId()` from `lib/generate-id.ts`.

---

## 5. Schema Changes

### empirical.ts — PredictionFrontmatter additions

```typescript
// Add to existing PredictionFrontmatter:
resolution_date: z.string().optional(),
resolution_notes: z.string().optional(),
cascaded: z.boolean().optional(),
```

### empirical.ts — DecisionFrontmatter additions

```typescript
// Add to existing DecisionFrontmatter:
resolution_date: z.string().optional(),
resolution_notes: z.string().optional(),
cascaded: z.boolean().optional(),
```

### frontmatter.ts — InsightFrontmatter addition

```typescript
// Add to existing InsightFrontmatter:
empirical_state: z.enum(["confirmed", "falsified"]).optional(),
```

### frontmatter.ts — PrincipleFrontmatter addition

```typescript
// Add to existing PrincipleFrontmatter:
empirical_state: z.enum(["confirmed", "falsified"]).optional(),
```

### frontmatter.ts — TensionFrontmatter additions

```typescript
// Add to existing TensionFrontmatter:
type: z.enum(["keyword", "empirical_failure"]).optional(),  // defaults to "keyword" for existing tensions
source_principle: z.string().optional(),                     // PRI- ID for empirical failures
resolution_notes: z.string().optional(),                     // from the resolved prediction/decision
date_created: z.string().optional(),                         // ISO date
```

---

## 6. Mechanism 3 Update (Consensus Guard)

In `propagateConfidence()`, add a check before boosting any insight:

```typescript
// After loading insight frontmatter, before applying confidence boost:
if (data.empirical_state === "falsified") continue;
```

This prevents structural consensus from overriding empirical evidence. A node that was empirically falsified stays at its reduced confidence until a future positive outcome clears the state.

---

## 7. learn.ts Orchestration

Mechanism 8 runs after mechanism 7, before flags are written.

```typescript
// After mechanism 7:
console.log("── Mechanism 8: Empirical Propagation ──");
const empiricalChanges = await propagateEmpiricalConfidence(db, KB_ROOT);
if (empiricalChanges.length > 0) {
  for (const change of empiricalChanges) {
    const arrow = change.resolvedStatus === 'confirmed' || change.resolvedStatus === 'success' ? '↑' : '↓';
    console.log(
      `  ${change.resolvedId} (${change.resolvedStatus}) → ${change.affectedId}: ${change.oldConfidence} ${arrow} ${change.newConfidence} (${change.cascade})`
    );
  }
  console.log(`\n${empiricalChanges.length} empirical confidence update(s) applied.\n`);
} else {
  console.log("  No empirical outcomes to process.\n");
}
```

Learning summary adds:
```
│  Empirical updates: N              │
```

---

## 8. End-to-End Data Flow

### Positive path (prediction confirmed):

```
Day 1:
  npx tsx scripts/predict.ts --file /tmp/pred.json
  → predictions/nvidia-supply-constrained.md
    status: active, derived_from: [PRI-260321-5BF1]

Day 90:
  npx tsx scripts/wake.ts
  → "## Outcomes Due — No outcomes due today."
  (but you notice NVIDIA Q2 earnings confirm supply constraints)

  npx tsx scripts/resolve.ts \
    --id PRED-260322-39B8 \
    --status confirmed \
    --notes "NVIDIA Q2 2026 confirmed demand exceeds TSMC capacity" \
    --post-ingest

  → resolve.ts:
    1. Finds predictions/nvidia-supply-constrained.md
    2. Validates: status=active, target=confirmed ✓
    3. Writes: status→confirmed, resolution_date, resolution_notes
    4. Runs post-ingest

  → post-ingest → learn.ts → mechanism 8:
    1. Scans predictions/ for resolved + not cascaded
    2. Finds PRED-260322-39B8 (confirmed, cascaded=undefined)
    3. Initializes processedIds = new Set()
    4. Reads derived_from: [PRI-260321-5BF1]
    5. PRI-260321-5BF1: boost medium→high, set empirical_state: "confirmed"
       processedIds.add("PRI-260321-5BF1")
    6. Reads PRI-260321-5BF1 supporting_insights: [INS-A, INS-B, INS-C]
    7. INS-A: boost medium→high, set empirical_state: "confirmed"
       INS-B: boost medium→high (already high? skip)
       INS-C: boost low→medium, set empirical_state: "confirmed"
    8. No tension spawned (positive outcome)
    9. Sets cascaded: true on prediction file
    10. Returns EmpiricalChange[] for summary

  → Next post-ingest: mechanism 8 sees cascaded=true, skips. ✓
  → Next post-ingest: mechanism 3 sees empirical_state="confirmed" on nodes,
    can still boost them further if structural evidence supports it. ✓
```

### Negative path (prediction falsified):

```
Day 180:
  npx tsx scripts/resolve.ts \
    --id PRED-260322-XXXX \
    --status falsified \
    --notes "Private credit market stabilized, no major fund collapse occurred" \
    --post-ingest

  → resolve.ts:
    1. Updates status→falsified, adds resolution metadata

  → mechanism 8:
    1. Finds the falsified prediction
    2. Reads derived_from: [PRI-260321-2DF0]
    3. PRI-260321-2DF0: drop high→medium, set empirical_state: "falsified"
       If shelf_life was "evergreen", flip to "time-sensitive"
    4. Do NOT cascade to supporting insights (asymmetric rule)
    5. Spawn tension T-XXXXXX-XXXX:
       - type: empirical_failure
       - side_a: [PRED-260322-XXXX]
       - side_b: [PRI-260321-2DF0]
       - Body includes investigation prompts
    6. Set cascaded: true

  → Next post-ingest: mechanism 3 sees empirical_state="falsified"
    on PRI-260321-2DF0, SKIPS it for structural boosting. ✓
  → Stale board now shows PRI-260321-2DF0 (was evergreen, now time-sensitive). ✓
  → Tension T-XXXXXX-XXXX appears in next session for Claude to investigate. ✓
```

---

## 9. Test Plan

### Mechanism 8 tests (in learning.test.ts):

| # | Test | What It Verifies |
|---|------|-----------------|
| 1 | Confirmed prediction boosts principle one level | Basic positive cascade |
| 2 | Confirmed prediction boosts supporting insights one level | Depth-1 cascade on success |
| 3 | Falsified prediction drops principle one level | Basic negative cascade |
| 4 | Falsified prediction does NOT drop supporting insights | Asymmetric cascading |
| 5 | Falsified prediction spawns empirical_failure tension | Tension spawning |
| 6 | Falsified prediction flips evergreen → time-sensitive | Shelf life mutation |
| 7 | Confidence cap: can't boost above very_high | Upper bound |
| 8 | Confidence floor: can't drop below low | Lower bound, never pending |
| 9 | cascaded: true items are skipped | Idempotency |
| 10 | processedIds prevents double-dip | Graph dedup |
| 11 | Mixed decisions: no cascade, marked cascaded | Mixed handling |
| 12 | empirical_state: "falsified" blocks mechanism 3 | Consensus guard |
| 13 | empirical_state: "confirmed" allows mechanism 3 | Confirmed nodes still boostable |
| 14 | Successful decision boosts informed_by insights + principles | Decision positive path |
| 15 | Failed decision drops only direct nodes, not supporting | Decision asymmetric |
| 16 | Failed decision spawns tension | Decision tension spawning |

### resolve.ts tests (integration):

| # | Test | What It Verifies |
|---|------|-----------------|
| 17 | Resolve prediction: status updates correctly | Basic functionality |
| 18 | Resolve decision: status updates correctly | Basic functionality |
| 19 | Already-resolved item errors | No double-resolution |
| 20 | Invalid status transition errors | Type safety |
| 21 | Missing ID errors gracefully | Error handling |
| 22 | Empty notes errors | Forced reflection |

---

## 10. Files Created / Modified

| File | Action | What Changes |
|------|--------|-------------|
| `scripts/resolve.ts` | **CREATE** | New CLI script (~120 lines) |
| `scripts/lib/learning.ts` | MODIFY | Add `propagateEmpiricalConfidence()` function, add `EmpiricalChange` interface, add `empirical_state` guard to mechanism 3 |
| `scripts/learn.ts` | MODIFY | Add mechanism 8 call + summary row |
| `scripts/schemas/empirical.ts` | MODIFY | Add optional `resolution_date`, `resolution_notes`, `cascaded` fields to both schemas |
| `scripts/schemas/frontmatter.ts` | MODIFY | Add optional `empirical_state` to InsightFrontmatter/PrincipleFrontmatter, add `type`/`source_principle`/`resolution_notes`/`date_created` to TensionFrontmatter |
| `scripts/lib/learning.test.ts` | MODIFY | Add ~22 tests for mechanism 8 + resolve |
| `CLAUDE.md` | MODIFY | Document resolve.ts in key scripts table |

---

## 11. What Is NOT In Scope

These are deferred to future builds (tracked in memory/project_zuhn_future.md):

- Stakes weighting on decisions (low/medium/high/critical)
- Numerical confidence scoring (0-100 composite replacing enum)
- Calibration tracking (personal Brier score per domain)
- Belief portfolio view
- Bounty system (gap fill, contrarian challenge, perspective blind spot, staleness alert)
- Decision playback retrospectives
- Adversarial bounties
