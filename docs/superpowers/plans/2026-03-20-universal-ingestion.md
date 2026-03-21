# Universal Content Ingestion Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a universal ingestion pipeline where any URL (YouTube, blog, Reddit, PDF) produces indexed, embedded, connected knowledge in three commands.

**Architecture:** Two new CLI scripts (`ingest.ts`, `extract.ts`) that separate deterministic I/O (TypeScript) from semantic reasoning (Claude). `ingest.ts` fetches and cleans content; `extract.ts` batch-writes insight files from Zod-validated JSON. The existing `post-ingest.ts` pipeline handles indexing, embedding, and learning.

**Tech Stack:** TypeScript (tsx), Zod, yt-dlp (YouTube), jsdom + @mozilla/readability (blogs), gray-matter (YAML frontmatter), Vitest (tests)

**Spec:** `docs/superpowers/specs/2026-03-20-universal-ingestion-design.md`

---

## File Map

### New Files

| File | Responsibility |
|------|---------------|
| `scripts/schemas/extraction.ts` | Zod schema for extraction JSON input |
| `scripts/lib/ingest/slug.ts` | Title → filesystem-safe kebab-case slug |
| `scripts/lib/ingest/detect.ts` | URL → ContentType classifier |
| `scripts/lib/ingest/transcript-clean.ts` | json3 subtitle data → clean paragraphs with chapters |
| `scripts/lib/ingest/youtube.ts` | yt-dlp wrapper: metadata + transcript |
| `scripts/lib/ingest/blog.ts` | fetch + readability article extraction |
| `scripts/lib/ingest/reddit.ts` | Reddit .json API + fallbacks |
| `scripts/lib/ingest/pdf.ts` | PDF download/copy + source creation |
| `scripts/lib/extract/write-insights.ts` | JSON → batch insight file creation + source update |
| `scripts/ingest.ts` | CLI entry point: URL → clean content |
| `scripts/extract.ts` | CLI entry point: JSON → insight files |
| `tests/fixtures/ingest/sample.json3` | YouTube json3 fixture |
| `tests/fixtures/ingest/sample-article.html` | Blog HTML fixture |
| `tests/fixtures/ingest/sample-reddit.json` | Reddit .json fixture |
| `tests/fixtures/ingest/sample-extraction.json` | ExtractionInput fixture |

### Modified Files

| File | Change |
|------|--------|
| `scripts/schemas/frontmatter.ts` | Add optional YouTube/blog/Reddit fields to SourceFrontmatter |
| `scripts/lib/generate-id.ts` | Add optional `salt` parameter |
| `scripts/lib/generate-id.test.ts` | Add salt parameter tests |
| `scripts/health.ts` | Expand source glob to include youtube/blog/pdf directories |
| `package.json` | Add jsdom, @mozilla/readability deps + ingest/extract scripts |

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install new dependencies**

Run:
```bash
npm install jsdom @mozilla/readability && npm install -D @types/jsdom
```

- [ ] **Step 2: Add npm scripts**

Add to `package.json` scripts:
```json
"ingest": "tsx scripts/ingest.ts",
"extract": "tsx scripts/extract.ts"
```

- [ ] **Step 3: Verify installation**

Run: `npm ls jsdom @mozilla/readability`
Expected: Both packages listed without errors

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add jsdom and readability deps for ingestion pipeline"
```

---

## Task 2: Update generate-id.ts with Salt Parameter

**Files:**
- Modify: `scripts/lib/generate-id.ts`
- Modify: `scripts/lib/generate-id.test.ts`

- [ ] **Step 1: Write failing tests for salt parameter**

Add to `scripts/lib/generate-id.test.ts`:
```typescript
describe("salt parameter", () => {
  it("produces different IDs with different salts", () => {
    const title = "Same title";
    const id1 = generateInsightId(title, "salt-0");
    const id2 = generateInsightId(title, "salt-1");
    expect(id1).not.toBe(id2);
  });

  it("produces same ID without salt (backward compatible)", () => {
    const title = "Backward compat";
    const before = generateInsightId(title);
    // Call again without salt — should still work
    expect(generateInsightId(title)).toBe(before);
  });

  it("salt works with numeric values", () => {
    const title = "Numeric salt";
    const id1 = generateInsightId(title, 0);
    const id2 = generateInsightId(title, 1);
    expect(id1).not.toBe(id2);
  });

  it("salt applies to all ID types", () => {
    const title = "Multi-type";
    expect(generateSourceId(title, "a")).not.toBe(generateSourceId(title, "b"));
    expect(generatePrincipleId(title, "a")).not.toBe(generatePrincipleId(title, "b"));
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run scripts/lib/generate-id.test.ts`
Expected: FAIL — `generateInsightId` does not accept second argument (TypeScript error)

- [ ] **Step 3: Update generate-id.ts to accept salt**

Replace `scripts/lib/generate-id.ts`:
```typescript
import { createHash } from "node:crypto";

function generateId(prefix: string, title: string, salt?: string | number): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const yymmdd = `${yy}${mm}${dd}`;

  const hashInput = salt !== undefined ? `${title}:${salt}` : title;
  const hash = createHash("sha256").update(hashInput).digest("hex");
  const suffix = hash.slice(-4).toUpperCase();

  return `${prefix}-${yymmdd}-${suffix}`;
}

export function generateInsightId(title: string, salt?: string | number): string {
  return generateId("INS", title, salt);
}

export function generateSourceId(title: string, salt?: string | number): string {
  return generateId("SRC", title, salt);
}

export function generatePrincipleId(title: string, salt?: string | number): string {
  return generateId("PRI", title, salt);
}

export function generateMentalModelId(title: string, salt?: string | number): string {
  return generateId("MM", title, salt);
}

export function generateTensionId(title: string, salt?: string | number): string {
  return generateId("T", title, salt);
}
```

- [ ] **Step 4: Run tests to verify all pass**

Run: `npx vitest run scripts/lib/generate-id.test.ts`
Expected: ALL PASS (both old and new tests)

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/generate-id.ts scripts/lib/generate-id.test.ts
git commit -m "feat: add salt parameter to ID generation for batch uniqueness"
```

---

## Task 3: Update SourceFrontmatter Schema

**Files:**
- Modify: `scripts/schemas/frontmatter.ts`
- Modify: `scripts/health.ts`

- [ ] **Step 1: Run existing tests to confirm green baseline**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 2: Add optional fields to SourceFrontmatter**

In `scripts/schemas/frontmatter.ts`, add these optional fields to the `SourceFrontmatter` object, after the existing optional fields:
```typescript
// YouTube-specific
channel: z.string().optional(),
duration: z.string().optional(),
views: z.number().optional(),
upload_date: z.string().optional(),
chapters: z.number().optional(),
transcript_type: z.enum(["auto", "manual"]).optional(),
// Blog-specific
site_name: z.string().optional(),
publish_date: z.string().optional(),
// Reddit-specific
score: z.number().optional(),
num_comments: z.number().optional(),
// Shared
word_count: z.number().optional(),
```

- [ ] **Step 3: Update health.ts source validation glob**

In `scripts/health.ts`, change the source validation glob from:
```typescript
"sources/{reddit,paste}/*.md"
```
to:
```typescript
"sources/{reddit,paste,youtube,blog,pdf}/*.md"
```

- [ ] **Step 4: Run all tests + health check**

Run: `npx vitest run && npx tsx scripts/health.ts`
Expected: ALL PASS. Health check should now also validate the 3 existing YouTube source files.

- [ ] **Step 5: Commit**

```bash
git add scripts/schemas/frontmatter.ts scripts/health.ts
git commit -m "feat: extend SourceFrontmatter with optional type-specific fields"
```

---

## Task 4: Create Extraction Schema

**Files:**
- Create: `scripts/schemas/extraction.ts`

- [ ] **Step 1: Create the extraction schema file**

Create `scripts/schemas/extraction.ts`:
```typescript
import { z } from "zod";

const lowerCase = (val: unknown) =>
  typeof val === "string" ? val.toLowerCase() : val;

export const ExtractionInsight = z.object({
  domain: z.string(),
  topic: z.string(),
  subtopic: z.string().optional(),
  title: z.string(),
  actionability: z.preprocess(
    lowerCase,
    z.enum(["immediate", "reference", "inspiration"])
  ),
  confidence: z.preprocess(
    lowerCase,
    z.enum(["pending", "low", "medium", "high", "very_high"])
  ),
  shelf_life: z.preprocess(
    lowerCase,
    z.enum(["evergreen", "time-sensitive"])
  ),
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

export type ExtractionInsightData = z.infer<typeof ExtractionInsight>;
export type ExtractionInputData = z.infer<typeof ExtractionInput>;
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsx -e "import './scripts/schemas/extraction'; console.log('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add scripts/schemas/extraction.ts
git commit -m "feat: add Zod schema for extraction JSON input"
```

---

## Task 5: Create slug.ts

**Files:**
- Create: `scripts/lib/ingest/slug.ts`
- Create: `scripts/lib/ingest/slug.test.ts`

- [ ] **Step 1: Create the test directory and write tests**

Run: `mkdir -p scripts/lib/ingest`

Create `scripts/lib/ingest/slug.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("converts spaces to hyphens", () => {
    expect(slugify("hello world")).toBe("hello-world");
  });

  it("lowercases everything", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(slugify("What's the deal?!")).toBe("whats-the-deal");
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("this --- is -- weird")).toBe("this-is-weird");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  --hello-- ")).toBe("hello");
  });

  it("handles unicode by stripping non-ASCII", () => {
    expect(slugify("Café résumé")).toBe("caf-rsum");
  });

  it("handles long titles by truncating", () => {
    const long = "a".repeat(200);
    const result = slugify(long);
    expect(result.length).toBeLessThanOrEqual(80);
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("untitled");
  });

  it("handles strings that become empty after stripping", () => {
    expect(slugify("!!!")).toBe("untitled");
  });

  it("matches existing knowledge base slug patterns", () => {
    expect(slugify("Charge premium from day one")).toBe("charge-premium-from-day-one");
    expect(slugify("Build Navy SEALs not the Navy content team")).toBe(
      "build-navy-seals-not-the-navy-content-team"
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run scripts/lib/ingest/slug.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement slug.ts**

Create `scripts/lib/ingest/slug.ts`:
```typescript
const MAX_SLUG_LENGTH = 80;

export function slugify(title: string): string {
  let slug = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")   // strip non-ASCII
    .replace(/[^a-z0-9\s-]/g, "")   // keep only alphanumeric, spaces, hyphens
    .replace(/[\s-]+/g, "-")         // spaces/hyphens → single hyphen
    .replace(/^-+|-+$/g, "");        // trim leading/trailing hyphens

  if (slug.length === 0) return "untitled";
  if (slug.length > MAX_SLUG_LENGTH) slug = slug.slice(0, MAX_SLUG_LENGTH).replace(/-+$/, "");

  return slug;
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run scripts/lib/ingest/slug.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/ingest/slug.ts scripts/lib/ingest/slug.test.ts
git commit -m "feat: add slugify utility for filesystem-safe names"
```

---

## Task 6: Create write-insights.ts (Core)

**Files:**
- Create: `scripts/lib/extract/write-insights.ts`
- Create: `scripts/lib/extract/write-insights.test.ts`
- Create: `tests/fixtures/ingest/sample-extraction.json`

- [ ] **Step 1: Create test fixture**

Run: `mkdir -p scripts/lib/extract tests/fixtures/ingest`

Create `tests/fixtures/ingest/sample-extraction.json`:
```json
{
  "source_summary": "A podcast interview about AI automation honesty.",
  "insights": [
    {
      "domain": "ai-development",
      "topic": "automation",
      "title": "Only automate what you deeply understand",
      "actionability": "immediate",
      "confidence": "high",
      "shelf_life": "evergreen",
      "tags": ["automation", "understanding", "ai-agents"],
      "resolutions": {
        "one_line": "Automate only processes you deeply understand — automating ignorance scales mistakes.",
        "standard": "Max warns that automating what you don't understand just makes failures faster and harder to debug. First build the manual process, then automate."
      }
    },
    {
      "domain": "startups",
      "topic": "hiring",
      "title": "Convert customers into employees",
      "actionability": "reference",
      "confidence": "medium",
      "shelf_life": "evergreen",
      "tags": ["hiring", "customers", "culture-fit"],
      "resolutions": {
        "one_line": "Your best hires are users who already love and understand your product.",
        "standard": "Gumloop converts power users into team members. They already know the product, believe in the mission, and require less onboarding."
      }
    }
  ]
}
```

- [ ] **Step 2: Write failing tests**

Create `scripts/lib/extract/write-insights.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { join } from "node:path";
import { mkdtemp, rm, readFile, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { writeInsights } from "./write-insights";

let tempDir: string;
let kbRoot: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "zuhn-test-"));
  kbRoot = join(tempDir, "knowledge-base");
  // Create a mock source file
  await mkdir(join(kbRoot, "sources", "youtube"), { recursive: true });
  const sourceMd = [
    "---",
    'id: SRC-260320-A1B2',
    'type: youtube',
    'title: "Test Video"',
    'author: "Test Author"',
    'url: "https://youtu.be/test"',
    'date_ingested: "2026-03-20"',
    "insight_count: 0",
    "---",
    "",
  ].join("\n");
  await writeFile(join(kbRoot, "sources", "youtube", "test-video.md"), sourceMd);
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("writeInsights", () => {
  it("creates insight files with correct frontmatter", async () => {
    const result = await writeInsights(
      {
        source_summary: "A test video about automation.",
        insights: [
          {
            domain: "ai-development",
            topic: "automation",
            title: "Test insight title",
            actionability: "immediate",
            confidence: "high",
            shelf_life: "evergreen",
            tags: ["test"],
            resolutions: {
              one_line: "One line summary.",
              standard: "Standard resolution.",
            },
          },
        ],
      },
      "SRC-260320-A1B2",
      kbRoot
    );

    expect(result.created).toBe(1);
    expect(result.files.length).toBe(1);

    const content = await readFile(result.files[0], "utf-8");
    expect(content).toContain("id: INS-");
    expect(content).toContain("domain: ai-development");
    expect(content).toContain("topic: automation");
    expect(content).toContain("status: active");
    expect(content).toContain("indexed: false");
    expect(content).toContain("embedded: false");
  });

  it("creates directories for new domains/topics", async () => {
    const result = await writeInsights(
      {
        source_summary: "Summary.",
        insights: [
          {
            domain: "new-domain",
            topic: "new-topic",
            title: "Brand new insight",
            actionability: "reference",
            confidence: "medium",
            shelf_life: "evergreen",
            tags: ["new"],
            resolutions: {
              one_line: "New one liner.",
              standard: "New standard.",
            },
          },
        ],
      },
      "SRC-260320-A1B2",
      kbRoot
    );

    expect(result.created).toBe(1);
    expect(result.files[0]).toContain("new-domain/new-topic/");
  });

  it("updates source file insight_count and summary", async () => {
    await writeInsights(
      {
        source_summary: "Updated summary.",
        insights: [
          {
            domain: "ai-development",
            topic: "automation",
            title: "Insight A",
            actionability: "immediate",
            confidence: "high",
            shelf_life: "evergreen",
            tags: ["a"],
            resolutions: { one_line: "A.", standard: "A detail." },
          },
          {
            domain: "ai-development",
            topic: "automation",
            title: "Insight B",
            actionability: "reference",
            confidence: "medium",
            shelf_life: "evergreen",
            tags: ["b"],
            resolutions: { one_line: "B.", standard: "B detail." },
          },
        ],
      },
      "SRC-260320-A1B2",
      kbRoot
    );

    const sourceContent = await readFile(
      join(kbRoot, "sources", "youtube", "test-video.md"),
      "utf-8"
    );
    expect(sourceContent).toContain("insight_count: 2");
    expect(sourceContent).toContain("Updated summary.");
  });

  it("handles slug collisions by appending hash suffix", async () => {
    // Write first insight
    await writeInsights(
      {
        source_summary: "Summary.",
        insights: [
          {
            domain: "ai-development",
            topic: "automation",
            title: "Duplicate title",
            actionability: "immediate",
            confidence: "high",
            shelf_life: "evergreen",
            tags: ["dup"],
            resolutions: { one_line: "First.", standard: "First detail." },
          },
        ],
      },
      "SRC-260320-A1B2",
      kbRoot
    );

    // Write second insight with same title (different source, simulating cross-session)
    const result = await writeInsights(
      {
        source_summary: "Summary 2.",
        insights: [
          {
            domain: "ai-development",
            topic: "automation",
            title: "Duplicate title",
            actionability: "reference",
            confidence: "low",
            shelf_life: "evergreen",
            tags: ["dup2"],
            resolutions: { one_line: "Second.", standard: "Second detail." },
          },
        ],
      },
      "SRC-260320-A1B2",
      kbRoot
    );

    // Second file should have a suffix
    expect(result.files[0]).not.toBe(
      join(kbRoot, "domains", "ai-development", "automation", "duplicate-title.md")
    );
    expect(result.files[0]).toContain("duplicate-title-");
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run scripts/lib/extract/write-insights.test.ts`
Expected: FAIL — module not found

- [ ] **Step 4: Implement write-insights.ts**

Create `scripts/lib/extract/write-insights.ts`:
```typescript
import { join } from "node:path";
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import matter from "gray-matter";
import { generateInsightId } from "../generate-id";
import { slugify } from "../ingest/slug";
import type { ExtractionInputData } from "../../schemas/extraction";

interface SourceInfo {
  type: string;
  title: string;
  author?: string;
  url?: string;
}

interface WriteResult {
  created: number;
  files: string[];
  errors: string[];
  newTopics: string[];
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function findSourceFile(
  sourceId: string,
  kbRoot: string
): Promise<{ path: string; info: SourceInfo } | null> {
  const fg = (await import("fast-glob")).default;
  const files = await fg("sources/**/*.md", {
    cwd: kbRoot,
    absolute: true,
    ignore: ["**/_index.md", "**/raw/**"],
  });

  for (const filePath of files) {
    const raw = await readFile(filePath, "utf-8");
    const { data } = matter(raw);
    if (data.id === sourceId) {
      return {
        path: filePath,
        info: {
          type: data.type,
          title: data.title,
          author: data.author,
          url: data.url,
        },
      };
    }
  }
  return null;
}

function formatFrontmatter(data: Record<string, unknown>): string {
  const yaml = matter.stringify("", data);
  return yaml;
}

export async function writeInsights(
  input: ExtractionInputData,
  sourceId: string,
  kbRoot: string
): Promise<WriteResult> {
  const result: WriteResult = {
    created: 0,
    files: [],
    errors: [],
    newTopics: [],
  };

  // Find source file
  const source = await findSourceFile(sourceId, kbRoot);
  if (!source) {
    result.errors.push(`Source ${sourceId} not found in knowledge base`);
    return result;
  }

  const today = new Date().toISOString().slice(0, 10);
  const salt = `${sourceId}-${Date.now()}`;

  for (let i = 0; i < input.insights.length; i++) {
    const insight = input.insights[i];
    const id = generateInsightId(insight.title, `${salt}-${i}`);
    let slug = slugify(insight.title);

    // Build file path
    const topicDir = join(kbRoot, "domains", insight.domain, insight.topic);
    await mkdir(topicDir, { recursive: true });

    let filePath = join(topicDir, `${slug}.md`);

    // Handle slug collisions
    if (await fileExists(filePath)) {
      const hashSuffix = id.split("-").pop()!.toLowerCase();
      slug = `${slug}-${hashSuffix}`;
      filePath = join(topicDir, `${slug}.md`);
      // Track new topics
    }

    // Track genuinely new topic directories
    const overviewPath = join(topicDir, "_summary.md");
    if (!(await fileExists(overviewPath)) && !result.newTopics.includes(`${insight.domain}/${insight.topic}`)) {
      result.newTopics.push(`${insight.domain}/${insight.topic}`);
    }

    // Build frontmatter
    const frontmatter: Record<string, unknown> = {
      id,
      domain: insight.domain,
      topic: insight.topic,
      ...(insight.subtopic ? { subtopic: insight.subtopic } : {}),
      title: insight.title,
      actionability: insight.actionability,
      confidence: insight.confidence,
      shelf_life: insight.shelf_life,
      status: "active",
      tags: insight.tags,
      sources: [
        {
          type: source.info.type,
          title: source.info.title,
          ...(source.info.author ? { author: source.info.author } : {}),
          ...(source.info.url ? { url: source.info.url } : {}),
        },
      ],
      related: [],
      date_extracted: today,
      last_accessed: null,
      access_count: 0,
      indexed: false,
      embedded: false,
      resolutions: insight.resolutions,
    };

    const content = formatFrontmatter(frontmatter) + insight.resolutions.standard + "\n";
    await writeFile(filePath, content, "utf-8");
    result.files.push(filePath);
    result.created++;
  }

  // Update source file
  if (source) {
    const raw = await readFile(source.path, "utf-8");
    const { data } = matter(raw);
    const existingCount = (data.insight_count as number) || 0;
    data.insight_count = existingCount + result.created;
    const updatedContent = matter.stringify(
      "\n" + input.source_summary + "\n",
      data
    );
    await writeFile(source.path, updatedContent, "utf-8");
  }

  return result;
}
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run scripts/lib/extract/write-insights.test.ts`
Expected: ALL PASS

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/extract/ tests/fixtures/ingest/sample-extraction.json
git commit -m "feat: add write-insights batch file creator"
```

---

## Task 7: Create extract.ts CLI

**Files:**
- Create: `scripts/extract.ts`

- [ ] **Step 1: Implement extract.ts**

Create `scripts/extract.ts`:
```typescript
#!/usr/bin/env npx tsx

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { ExtractionInput } from "./schemas/extraction";
import { writeInsights } from "./lib/extract/write-insights";

const PROJECT_ROOT = join(__dirname, "..");
const KB_ROOT = join(PROJECT_ROOT, "knowledge-base");

// ─── Parse CLI args ──────────────────────────────────────────────────

function parseArgs(argv: string[]): {
  source: string;
  file: string;
  postIngest: boolean;
} {
  let source = "";
  let file = "";
  let postIngest = false;

  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--source" && argv[i + 1]) {
      source = argv[++i];
    } else if (argv[i] === "--file" && argv[i + 1]) {
      file = argv[++i];
    } else if (argv[i] === "--post-ingest") {
      postIngest = true;
    }
  }

  if (!source || !file) {
    console.error("Usage: extract.ts --source SRC-XXXXXX-XXXX --file path.json [--post-ingest]");
    process.exit(1);
  }

  return { source, file, postIngest };
}

// ─── Main ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const flags = parseArgs(process.argv);

  // Read and parse JSON (with code-fence stripping + truncation detection)
  let raw: string;
  try {
    raw = await readFile(flags.file, "utf-8");
  } catch {
    console.error(`Error: Could not read file "${flags.file}".`);
    process.exit(1);
  }

  // Strip markdown code fences (Claude RLHF habit)
  raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  let parsed;
  try {
    parsed = ExtractionInput.parse(JSON.parse(raw));
  } catch (err) {
    if (err instanceof SyntaxError) {
      console.error("Error: Malformed JSON — likely truncated.");
      console.error("If extracting many insights, write in batches of 8-10.");
      console.error("Run extract.ts after each batch (it appends to insight_count).");
      process.exit(1);
    }
    // Zod validation error
    console.error("Error: JSON validation failed:");
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  console.log(`Validated ${parsed.insights.length} insights (0 errors)`);

  // Write insight files
  const result = await writeInsights(parsed, flags.source, KB_ROOT);

  if (result.errors.length > 0) {
    for (const err of result.errors) {
      console.error(`  ERROR: ${err}`);
    }
    process.exit(1);
  }

  // Report
  console.log(`Created ${result.created} insight files:`);
  if (result.newTopics.length > 0) {
    for (const topic of result.newTopics) {
      console.log(`  ${topic} ← new topic created`);
    }
  }
  console.log(`Updated source ${flags.source} (insight_count: +${result.created})`);

  // Post-ingest
  if (flags.postIngest) {
    console.log("\nRunning post-ingest pipeline...");
    try {
      execFileSync("npx", ["tsx", join(PROJECT_ROOT, "scripts", "post-ingest.ts")], {
        stdio: "inherit",
        cwd: PROJECT_ROOT,
      });
    } catch {
      console.error("Post-ingest pipeline failed.");
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error("extract.ts failed:", err);
  process.exit(1);
});
```

- [ ] **Step 2: Test manually with fixture**

Run:
```bash
npx tsx scripts/extract.ts --source SRC-260320-8182 --file tests/fixtures/ingest/sample-extraction.json
```
Expected: Should create 2 insight files under `knowledge-base/domains/` and update the Gumloop source file's insight_count.

**Note:** After verifying, revert the test-created files:
```bash
git checkout knowledge-base/
```

- [ ] **Step 3: Commit**

```bash
git add scripts/extract.ts
git commit -m "feat: add extract.ts CLI for batch insight creation"
```

---

## Task 8: Create detect.ts (URL Classification)

**Files:**
- Create: `scripts/lib/ingest/detect.ts`
- Create: `scripts/lib/ingest/detect.test.ts`

- [ ] **Step 1: Write tests**

Create `scripts/lib/ingest/detect.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { detectType, normalizeUrl } from "./detect";

describe("detectType", () => {
  it("detects standard YouTube URLs", () => {
    expect(detectType("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("youtube");
  });

  it("detects youtu.be short URLs", () => {
    expect(detectType("https://youtu.be/dQw4w9WgXcQ")).toBe("youtube");
  });

  it("detects YouTube Shorts", () => {
    expect(detectType("https://youtube.com/shorts/abc123")).toBe("youtube");
  });

  it("detects mobile YouTube", () => {
    expect(detectType("https://m.youtube.com/watch?v=abc")).toBe("youtube");
  });

  it("rejects YouTube playlist page URLs", () => {
    expect(() => detectType("https://youtube.com/playlist?list=PL123")).toThrow(/playlist/i);
  });

  it("allows single videos even with list param", () => {
    expect(detectType("https://youtube.com/watch?v=abc&list=PL123")).toBe("youtube");
  });

  it("detects Reddit URLs", () => {
    expect(detectType("https://www.reddit.com/r/ClaudeCode/comments/abc/title")).toBe("reddit");
  });

  it("detects old.reddit.com", () => {
    expect(detectType("https://old.reddit.com/r/n8n/comments/xyz")).toBe("reddit");
  });

  it("detects PDF by extension", () => {
    expect(detectType("https://example.com/paper.pdf")).toBe("pdf");
  });

  it("defaults to blog for unknown URLs", () => {
    expect(detectType("https://blog.example.com/my-article")).toBe("blog");
  });
});

describe("normalizeUrl", () => {
  it("strips utm parameters", () => {
    expect(normalizeUrl("https://example.com/page?utm_source=twitter&utm_medium=social")).toBe(
      "https://example.com/page"
    );
  });

  it("strips si parameter from YouTube", () => {
    expect(normalizeUrl("https://youtu.be/abc?si=xyz123")).toBe("https://youtu.be/abc");
  });

  it("preserves non-tracking params", () => {
    expect(normalizeUrl("https://youtube.com/watch?v=abc")).toBe(
      "https://youtube.com/watch?v=abc"
    );
  });

  it("normalizes m.youtube.com", () => {
    expect(normalizeUrl("https://m.youtube.com/watch?v=abc")).toBe(
      "https://www.youtube.com/watch?v=abc"
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run scripts/lib/ingest/detect.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement detect.ts**

Create `scripts/lib/ingest/detect.ts`:
```typescript
export type ContentType = "youtube" | "reddit" | "blog" | "pdf";

const TRACKING_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref", "si", "source"];

export function normalizeUrl(urlString: string): string {
  const url = new URL(urlString);

  // Normalize mobile YouTube
  if (url.hostname === "m.youtube.com") {
    url.hostname = "www.youtube.com";
  }

  // Strip tracking params
  for (const param of TRACKING_PARAMS) {
    url.searchParams.delete(param);
  }

  // Clean up empty query string
  const result = url.toString();
  return result.endsWith("?") ? result.slice(0, -1) : result;
}

export function detectType(urlString: string): ContentType {
  const url = new URL(urlString);
  const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");

  // YouTube
  if (host === "youtube.com" || host === "youtu.be") {
    // Reject playlist page URLs (but allow single videos within playlists)
    if (url.pathname === "/playlist") {
      throw new Error("This is a playlist. Pass individual video URLs.");
    }
    return "youtube";
  }

  // Reddit
  if (host === "reddit.com" || host === "old.reddit.com") {
    return "reddit";
  }

  // PDF (by extension)
  if (url.pathname.toLowerCase().endsWith(".pdf")) {
    return "pdf";
  }

  // Default: blog
  return "blog";
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run scripts/lib/ingest/detect.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/ingest/detect.ts scripts/lib/ingest/detect.test.ts
git commit -m "feat: add URL type detection with normalization"
```

---

## Task 9: Create transcript-clean.ts (json3 Processing)

**Files:**
- Create: `scripts/lib/ingest/transcript-clean.ts`
- Create: `scripts/lib/ingest/transcript-clean.test.ts`
- Create: `tests/fixtures/ingest/sample.json3`

- [ ] **Step 1: Create json3 fixture**

Create `tests/fixtures/ingest/sample.json3` with a minimal json3 structure. Note: YouTube json3 files have an `events` array where each event has `tStartMs` and either `segs` (auto-captions) or `utf8` (manual captions).

```json
{
  "events": [
    { "tStartMs": 0, "segs": [{"utf8": "Hello "}, {"utf8": "world."}] },
    { "tStartMs": 1500, "segs": [{"utf8": "This "}, {"utf8": "is "}, {"utf8": "a test."}] },
    { "tStartMs": 6000, "segs": [{"utf8": "After "}, {"utf8": "a gap."}] },
    { "tStartMs": 7000, "utf8": "Manual caption line." },
    { "tStartMs": 8000, "segs": [{"utf8": "[Music]"}] },
    { "tStartMs": 9000, "segs": [{"utf8": "Final "}, {"utf8": "words."}] }
  ]
}
```

- [ ] **Step 2: Write tests**

Create `scripts/lib/ingest/transcript-clean.test.ts`:
```typescript
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
    // There's a 4.5s gap between 1500ms and 6000ms
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
      events: [
        { tStartMs: 0, segs: [{ utf8: "Something [inaudible] here." }] },
      ],
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
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run scripts/lib/ingest/transcript-clean.test.ts`
Expected: FAIL

- [ ] **Step 4: Implement transcript-clean.ts**

Create `scripts/lib/ingest/transcript-clean.ts`:
```typescript
export interface Chapter {
  title: string;
  startMs: number;
  endMs: number;
}

export interface CleanResult {
  text: string;
  wordCount: number;
}

const STRIP_MARKERS = /\[(Music|Applause|Laughter)\]/gi;
const GAP_THRESHOLD_MS = 3000;

interface Json3Event {
  tStartMs: number;
  segs?: { utf8: string }[];
  utf8?: string;
}

function extractText(event: Json3Event): string {
  const raw = event.segs
    ? event.segs.map((s) => s.utf8).join("")
    : event.utf8 || "";
  return raw;
}

function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function cleanTranscript(
  json3String: string,
  chapters?: Chapter[]
): CleanResult {
  const data = JSON.parse(json3String);
  const events: Json3Event[] = data.events || [];

  const paragraphs: string[] = [];
  let currentParagraph: string[] = [];
  let lastTimestamp = 0;
  let currentChapterIdx = 0;

  for (const event of events) {
    const text = extractText(event).trim();
    if (!text) continue;

    // Strip noise markers but keep [inaudible]
    const cleaned = text.replace(STRIP_MARKERS, "").trim();
    if (!cleaned) continue;

    // Check for chapter boundary
    if (chapters && currentChapterIdx < chapters.length) {
      const chapter = chapters[currentChapterIdx];
      if (event.tStartMs >= chapter.startMs && currentChapterIdx > 0) {
        // Flush current paragraph
        if (currentParagraph.length > 0) {
          paragraphs.push(currentParagraph.join(" "));
          currentParagraph = [];
        }
      }
      // Insert chapter header at boundary
      if (
        currentChapterIdx < chapters.length &&
        event.tStartMs >= chapters[currentChapterIdx].startMs
      ) {
        const ch = chapters[currentChapterIdx];
        paragraphs.push(
          `## ${ch.title} (${formatTimestamp(ch.startMs)}–${formatTimestamp(ch.endMs)})`
        );
        currentChapterIdx++;
      }
    }

    // Check for gap → new paragraph
    if (event.tStartMs - lastTimestamp > GAP_THRESHOLD_MS && currentParagraph.length > 0) {
      paragraphs.push(currentParagraph.join(" "));
      currentParagraph = [];
    }

    currentParagraph.push(cleaned);
    lastTimestamp = event.tStartMs;
  }

  // Flush last paragraph
  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph.join(" "));
  }

  const text = paragraphs.join("\n\n");
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return { text, wordCount };
}
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run scripts/lib/ingest/transcript-clean.test.ts`
Expected: ALL PASS

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/ingest/transcript-clean.ts scripts/lib/ingest/transcript-clean.test.ts tests/fixtures/ingest/sample.json3
git commit -m "feat: add json3 transcript cleaner with chapter support"
```

---

## Task 10: Create youtube.ts (yt-dlp Wrapper)

**Files:**
- Create: `scripts/lib/ingest/youtube.ts`

- [ ] **Step 1: Implement youtube.ts**

Create `scripts/lib/ingest/youtube.ts`:
```typescript
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import matter from "gray-matter";
import { generateSourceId } from "../generate-id";
import { slugify } from "./slug";
import { cleanTranscript, type Chapter } from "./transcript-clean";

const KB_ROOT = join(__dirname, "../../..", "knowledge-base");

export interface YouTubeMetadata {
  title: string;
  channel: string;
  duration: number;
  viewCount: number;
  uploadDate: string;
  chapters: Chapter[];
  hasAutoSubs: boolean;
  hasManualSubs: boolean;
}

export interface YouTubeResult {
  sourceId: string;
  sourcePath: string;
  rawPath: string;
  cleanText: string;
  wordCount: number;
  metadata: YouTubeMetadata;
}

function parseChapters(info: Record<string, unknown>): Chapter[] {
  const chapters = info.chapters as { title: string; start_time: number; end_time: number }[] | undefined;
  if (!chapters || !Array.isArray(chapters)) return [];
  return chapters.map((ch) => ({
    title: ch.title,
    startMs: Math.round(ch.start_time * 1000),
    endMs: Math.round(ch.end_time * 1000),
  }));
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export async function ingestYouTube(url: string): Promise<YouTubeResult> {
  // 1. Fetch metadata
  const metaJson = execFileSync("yt-dlp", ["--dump-json", "--no-warnings", "--quiet", url], {
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
  });
  const info = JSON.parse(metaJson);

  const metadata: YouTubeMetadata = {
    title: info.title || "Untitled",
    channel: info.channel || info.uploader || "Unknown",
    duration: info.duration || 0,
    viewCount: info.view_count || 0,
    uploadDate: info.upload_date
      ? `${info.upload_date.slice(0, 4)}-${info.upload_date.slice(4, 6)}-${info.upload_date.slice(6, 8)}`
      : "",
    chapters: parseChapters(info),
    hasAutoSubs: !!(info.automatic_captions?.en),
    hasManualSubs: !!(info.subtitles?.en),
  };

  // 2. Download transcript (json3 format)
  const slug = slugify(metadata.title);
  const rawDir = join(KB_ROOT, "sources", "youtube", "raw");
  await mkdir(rawDir, { recursive: true });
  const outputTemplate = join(rawDir, slug);

  try {
    execFileSync(
      "yt-dlp",
      [
        "--write-auto-sub",
        "--write-sub",
        "--sub-lang", "en",
        "--sub-format", "json3",
        "--skip-download",
        "--no-warnings",
        "--quiet",
        "-o", outputTemplate,
        url,
      ],
      { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }
    );
  } catch {
    throw new Error(
      "No English captions available. Paste transcript manually or wait for Phase 13 (Whisper)."
    );
  }

  // 3. Find the downloaded json3 file
  const fg = (await import("fast-glob")).default;
  const json3Files = await fg(`${slug}*.json3`, { cwd: rawDir, absolute: true });
  if (json3Files.length === 0) {
    throw new Error(
      "No English captions available. Paste transcript manually or wait for Phase 13 (Whisper)."
    );
  }
  const rawPath = json3Files[0];

  // 4. Clean transcript
  const json3Content = await readFile(rawPath, "utf-8");
  const { text, wordCount } = cleanTranscript(json3Content, metadata.chapters);

  // 5. Create source .md
  const sourceId = generateSourceId(metadata.title);
  const today = new Date().toISOString().slice(0, 10);
  const transcriptType = metadata.hasManualSubs ? "manual" : "auto";

  const sourceData = {
    id: sourceId,
    type: "youtube",
    title: metadata.title,
    author: metadata.channel,
    url,
    date_ingested: today,
    insight_count: 0,
    channel: metadata.channel,
    duration: formatDuration(metadata.duration),
    views: metadata.viewCount,
    upload_date: metadata.uploadDate,
    chapters: metadata.chapters.length,
    transcript_type: transcriptType,
    word_count: wordCount,
  };
  const sourceFrontmatter = matter.stringify("", sourceData);

  const sourceDir = join(KB_ROOT, "sources", "youtube");
  await mkdir(sourceDir, { recursive: true });
  const sourcePath = join(sourceDir, `${slug}.md`);

  await writeFile(sourcePath, sourceFrontmatter, "utf-8");

  return {
    sourceId,
    sourcePath,
    rawPath,
    cleanText: text,
    wordCount,
    metadata,
  };
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsx -e "import './scripts/lib/ingest/youtube'; console.log('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add scripts/lib/ingest/youtube.ts
git commit -m "feat: add YouTube ingestion via yt-dlp with json3 format"
```

---

## Task 11: Create blog.ts (Readability Extraction)

**Files:**
- Create: `scripts/lib/ingest/blog.ts`
- Create: `scripts/lib/ingest/blog.test.ts`
- Create: `tests/fixtures/ingest/sample-article.html`

- [ ] **Step 1: Create HTML fixture**

Create `tests/fixtures/ingest/sample-article.html`:
```html
<!DOCTYPE html>
<html>
<head>
  <title>How AI Changes Everything</title>
  <meta property="og:title" content="How AI Changes Everything" />
  <meta property="og:site_name" content="TechBlog" />
  <meta name="author" content="Jane Doe" />
  <meta property="article:published_time" content="2026-03-15" />
</head>
<body>
  <nav>Navigation links here</nav>
  <article>
    <h1>How AI Changes Everything</h1>
    <p>This is the first paragraph of a meaningful article about artificial intelligence and its impact on modern software development workflows.</p>
    <p>The second paragraph continues with more substantive content about how teams are adopting AI tools to improve their productivity and code quality.</p>
    <p>In conclusion, AI is transforming the way we build software, but human judgment remains essential for architecture decisions and code review.</p>
  </article>
  <footer>Footer content</footer>
</body>
</html>
```

- [ ] **Step 2: Write tests**

Create `scripts/lib/ingest/blog.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { extractArticle } from "./blog";

const FIXTURE_PATH = join(__dirname, "../../../tests/fixtures/ingest/sample-article.html");

describe("extractArticle", () => {
  it("extracts article text content", async () => {
    const html = await readFile(FIXTURE_PATH, "utf-8");
    const result = extractArticle(html, "https://techblog.com/ai-changes-everything");
    expect(result.text).toContain("artificial intelligence");
    expect(result.text).toContain("human judgment");
  });

  it("strips navigation and footer", async () => {
    const html = await readFile(FIXTURE_PATH, "utf-8");
    const result = extractArticle(html, "https://techblog.com/ai-changes-everything");
    expect(result.text).not.toContain("Navigation links");
    expect(result.text).not.toContain("Footer content");
  });

  it("extracts metadata from OpenGraph tags", async () => {
    const html = await readFile(FIXTURE_PATH, "utf-8");
    const result = extractArticle(html, "https://techblog.com/ai-changes-everything");
    expect(result.metadata.title).toBe("How AI Changes Everything");
    expect(result.metadata.siteName).toBe("TechBlog");
    expect(result.metadata.author).toBe("Jane Doe");
  });

  it("returns word count", async () => {
    const html = await readFile(FIXTURE_PATH, "utf-8");
    const result = extractArticle(html, "https://techblog.com/ai-changes-everything");
    expect(result.wordCount).toBeGreaterThan(20);
  });

  it("returns null for empty/minimal content", () => {
    const html = "<html><body><p>Short</p></body></html>";
    const result = extractArticle(html, "https://example.com");
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run scripts/lib/ingest/blog.test.ts`
Expected: FAIL

- [ ] **Step 4: Implement blog.ts**

Create `scripts/lib/ingest/blog.ts`:
```typescript
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export interface BlogMetadata {
  title: string;
  author: string;
  siteName: string;
  publishDate: string;
}

export interface ArticleResult {
  text: string;
  wordCount: number;
  metadata: BlogMetadata;
}

const MIN_CONTENT_LENGTH = 200;

function extractMeta(doc: Document): BlogMetadata {
  const og = (name: string) =>
    doc.querySelector(`meta[property="${name}"]`)?.getAttribute("content") || "";
  const meta = (name: string) =>
    doc.querySelector(`meta[name="${name}"]`)?.getAttribute("content") || "";

  return {
    title:
      og("og:title") ||
      meta("title") ||
      doc.querySelector("title")?.textContent || "Untitled",
    author:
      meta("author") ||
      og("article:author") || "",
    siteName:
      og("og:site_name") || "",
    publishDate:
      og("article:published_time") ||
      meta("date") || "",
  };
}

export function extractArticle(
  html: string,
  url: string
): ArticleResult | null {
  const dom = new JSDOM(html, { url });
  const metadata = extractMeta(dom.window.document);

  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article || !article.textContent || article.textContent.length < MIN_CONTENT_LENGTH) {
    return null;
  }

  const text = article.textContent.trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return { text, wordCount, metadata };
}
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run scripts/lib/ingest/blog.test.ts`
Expected: ALL PASS

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/ingest/blog.ts scripts/lib/ingest/blog.test.ts tests/fixtures/ingest/sample-article.html
git commit -m "feat: add blog article extraction with readability + jsdom"
```

---

## Task 12: Create reddit.ts

**Files:**
- Create: `scripts/lib/ingest/reddit.ts`
- Create: `scripts/lib/ingest/reddit.test.ts`
- Create: `tests/fixtures/ingest/sample-reddit.json`

- [ ] **Step 1: Create Reddit .json fixture**

Create `tests/fixtures/ingest/sample-reddit.json` — a minimal Reddit .json API response:
```json
[
  {
    "data": {
      "children": [
        {
          "kind": "t3",
          "data": {
            "title": "Test Reddit Post Title",
            "author": "testuser",
            "subreddit_name_prefixed": "r/testsubreddit",
            "selftext": "This is the body of the test post with some content.",
            "score": 142,
            "num_comments": 23,
            "created_utc": 1710000000
          }
        }
      ]
    }
  },
  {
    "data": {
      "children": [
        {
          "kind": "t1",
          "data": {
            "author": "commenter1",
            "body": "Great post, very insightful!",
            "score": 45
          }
        },
        {
          "kind": "t1",
          "data": {
            "author": "[deleted]",
            "body": "[removed]",
            "score": 0
          }
        },
        {
          "kind": "t1",
          "data": {
            "author": "commenter2",
            "body": "I disagree with point three.",
            "score": 12
          }
        }
      ]
    }
  }
]
```

- [ ] **Step 2: Write tests**

Create `scripts/lib/ingest/reddit.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseRedditJson } from "./reddit";

const FIXTURE_PATH = join(__dirname, "../../../tests/fixtures/ingest/sample-reddit.json");

describe("parseRedditJson", () => {
  it("extracts post title and author", async () => {
    const raw = await readFile(FIXTURE_PATH, "utf-8");
    const data = JSON.parse(raw);
    const post = parseRedditJson(data);
    expect(post.title).toBe("Test Reddit Post Title");
    expect(post.author).toBe("testuser");
  });

  it("extracts subreddit and score", async () => {
    const raw = await readFile(FIXTURE_PATH, "utf-8");
    const post = parseRedditJson(JSON.parse(raw));
    expect(post.subreddit).toBe("r/testsubreddit");
    expect(post.score).toBe(142);
  });

  it("extracts non-deleted comments", async () => {
    const raw = await readFile(FIXTURE_PATH, "utf-8");
    const post = parseRedditJson(JSON.parse(raw));
    expect(post.comments.length).toBe(2);
    expect(post.comments[0].author).toBe("commenter1");
  });

  it("skips deleted comments", async () => {
    const raw = await readFile(FIXTURE_PATH, "utf-8");
    const post = parseRedditJson(JSON.parse(raw));
    const deleted = post.comments.find((c) => c.author === "[deleted]");
    expect(deleted).toBeUndefined();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run scripts/lib/ingest/reddit.test.ts`
Expected: FAIL — module not found

- [ ] **Step 4: Implement reddit.ts**

Create `scripts/lib/ingest/reddit.ts`:
```typescript
const USER_AGENT = "BrainEngine-LocalIngest/1.0 (by /u/chlwlsdud)";

export interface RedditPost {
  title: string;
  author: string;
  subreddit: string;
  selftext: string;
  score: number;
  numComments: number;
  createdUtc: number;
  comments: { author: string; body: string; score: number }[];
}

export function parseRedditJson(data: unknown[]): RedditPost {
  const postData = (data as any)[0]?.data?.children?.[0]?.data;
  if (!postData) throw new Error("Could not parse Reddit response");

  const comments: RedditPost["comments"] = [];
  const commentList = (data as any)[1]?.data?.children || [];
  for (const c of commentList.slice(0, 10)) {
    if (c.kind === "t1" && c.data?.body && c.data.author !== "[deleted]") {
      comments.push({
        author: c.data.author,
        body: c.data.body,
        score: c.data.score || 0,
      });
    }
  }

  return {
    title: postData.title || "Untitled",
    author: postData.author || "unknown",
    subreddit: postData.subreddit_name_prefixed || "",
    selftext: postData.selftext || "",
    score: postData.score || 0,
    numComments: postData.num_comments || 0,
    createdUtc: postData.created_utc || 0,
    comments,
  };
}

export async function fetchRedditPost(url: string): Promise<RedditPost> {
  // Tier 1: Try .json API
  const jsonUrl = url.replace(/\/?$/, ".json");
  try {
    const resp = await fetch(jsonUrl, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (resp.ok) {
      const data = await resp.json();
      return parseRedditJson(data);
    }
  } catch {
    // Fall through to tier 2
  }

  // Tier 2: Try old.reddit.com (simpler HTML)
  try {
    const urlObj = new URL(url);
    const oldUrl = `https://old.reddit.com${urlObj.pathname}`;
    const resp = await fetch(oldUrl, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (resp.ok) {
      const html = await resp.text();
      // Extract title from <title> tag
      const titleMatch = html.match(/<title>([^<]+)<\/title>/);
      // Extract selftext from .usertext-body
      const bodyMatch = html.match(
        /<div class="(?:md|usertext-body)"[^>]*>([\s\S]*?)<\/div>/
      );
      if (titleMatch) {
        return {
          title: titleMatch[1].replace(/ : \w+$/, "").trim(),
          author: "unknown",
          subreddit: urlObj.pathname.split("/")[2] ? `r/${urlObj.pathname.split("/")[2]}` : "",
          selftext: bodyMatch
            ? bodyMatch[1].replace(/<[^>]+>/g, "").trim()
            : "",
          score: 0,
          numComments: 0,
          createdUtc: 0,
          comments: [],
        };
      }
    }
  } catch {
    // Fall through to tier 3
  }

  // Tier 3: Manual paste
  throw new Error(
    "Reddit blocked automated access. Paste the post content into conversation."
  );
}
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run scripts/lib/ingest/reddit.test.ts`
Expected: ALL PASS

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/ingest/reddit.ts scripts/lib/ingest/reddit.test.ts tests/fixtures/ingest/sample-reddit.json
git commit -m "feat: add Reddit ingestion with three-tier fallback"
```

---

## Task 13: Create pdf.ts

**Files:**
- Create: `scripts/lib/ingest/pdf.ts`
- Create: `scripts/lib/ingest/pdf.test.ts`

- [ ] **Step 1: Implement pdf.ts**

Create `scripts/lib/ingest/pdf.ts`:
```typescript
import { join } from "node:path";
import { mkdir, copyFile, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { generateSourceId } from "../generate-id";
import { slugify } from "./slug";

const KB_ROOT = join(__dirname, "../../..", "knowledge-base");

export interface PdfResult {
  sourceId: string;
  sourcePath: string;
  rawPath: string;
}

export async function ingestPdf(input: string): Promise<PdfResult> {
  const isUrl = input.startsWith("http://") || input.startsWith("https://");
  const title = isUrl
    ? decodeURIComponent(input.split("/").pop()?.replace(".pdf", "") || "document")
    : input.split("/").pop()?.replace(".pdf", "") || "document";

  const slug = slugify(title);
  const rawDir = join(KB_ROOT, "sources", "pdf", "raw");
  await mkdir(rawDir, { recursive: true });
  const rawPath = join(rawDir, `${slug}.pdf`);

  if (isUrl) {
    const resp = await fetch(input);
    if (!resp.ok || !resp.body) throw new Error(`Failed to download PDF: ${resp.status}`);
    await pipeline(Readable.fromWeb(resp.body as any), createWriteStream(rawPath));
  } else {
    await copyFile(input, rawPath);
  }

  const sourceId = generateSourceId(title);
  const today = new Date().toISOString().slice(0, 10);

  const sourceMd = [
    "---",
    `id: ${sourceId}`,
    `type: pdf`,
    `title: "${title.replace(/"/g, '\\"')}"`,
    `url: "${isUrl ? input : ""}"`,
    `date_ingested: "${today}"`,
    `insight_count: 0`,
    "---",
    "",
  ].join("\n");

  const sourceDir = join(KB_ROOT, "sources", "pdf");
  await mkdir(sourceDir, { recursive: true });
  const sourcePath = join(sourceDir, `${slug}.md`);
  await writeFile(sourcePath, sourceMd, "utf-8");

  return { sourceId, sourcePath, rawPath };
}
```

- [ ] **Step 2: Write basic test**

Create `scripts/lib/ingest/pdf.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { join } from "node:path";
import { mkdtemp, rm, writeFile, readFile, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { ingestPdf } from "./pdf";

// Note: ingestPdf needs to accept kbRoot override for testing
// We test the local file copy path (URL download needs network)

describe("ingestPdf (local file)", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "zuhn-pdf-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("copies local PDF to sources/pdf/raw/", async () => {
    const fakePdf = join(tempDir, "test-document.pdf");
    await writeFile(fakePdf, "fake pdf content");

    const result = await ingestPdf(fakePdf, join(tempDir, "kb"));
    await access(result.rawPath); // file exists
    expect(result.sourceId).toMatch(/^SRC-/);
  });
});
```

Update `pdf.ts` to accept optional `kbRoot` parameter for testability — add `kbRoot?: string` as second parameter with default to the project's knowledge-base path.

- [ ] **Step 3: Run tests**

Run: `npx vitest run scripts/lib/ingest/pdf.test.ts`
Expected: ALL PASS

- [ ] **Step 4: Commit**

```bash
git add scripts/lib/ingest/pdf.ts scripts/lib/ingest/pdf.test.ts
git commit -m "feat: add PDF download/copy with source file creation"
```

---

## Task 14: Create ingest.ts CLI (Wire Everything Together)

**Files:**
- Create: `scripts/ingest.ts`

- [ ] **Step 1: Implement ingest.ts**

Create `scripts/ingest.ts`:
```typescript
#!/usr/bin/env npx tsx

import { join } from "node:path";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import fg from "fast-glob";
import matter from "gray-matter";
import { detectType, normalizeUrl } from "./lib/ingest/detect";
import { parseMarkdownFile } from "./lib/parse-insight";

const KB_ROOT = join(__dirname, "..", "knowledge-base");
const LONG_CONTENT_THRESHOLD = 3000; // words

// ─── Duplicate detection ─────────────────────────────────────────────

async function findSourceByUrl(url: string): Promise<string | null> {
  const files = await fg("sources/**/*.md", {
    cwd: KB_ROOT,
    absolute: true,
    ignore: ["**/_index.md", "**/raw/**"],
  });

  for (const filePath of files) {
    const { data } = await parseMarkdownFile(filePath);
    if (data.url === url) return data.id as string;
  }
  return null;
}

// ─── Domain listing ──────────────────────────────────────────────────

async function listExistingDomains(): Promise<string[]> {
  const dirs = await fg("domains/*/", { cwd: KB_ROOT, onlyDirectories: true });
  return dirs.map((d) => d.replace("domains/", "").replace("/", ""));
}

// ─── Output helpers ──────────────────────────────────────────────────

function printMetadataHeader(
  sourceId: string,
  meta: Record<string, string | number | string[]>
): void {
  console.log(`\nSUCCESS: Source created as ${sourceId}\n`);
  console.log("## Source Metadata");
  for (const [key, value] of Object.entries(meta)) {
    if (Array.isArray(value)) {
      console.log(`- ${key}: ${value.join(", ")}`);
    } else {
      console.log(`- ${key}: ${value}`);
    }
  }
}

async function outputContent(
  text: string,
  wordCount: number,
  savePath: string
): Promise<void> {
  if (wordCount > LONG_CONTENT_THRESHOLD) {
    await mkdir(join(savePath, ".."), { recursive: true });
    await writeFile(savePath, text, "utf-8");
    console.log(`\nTranscript saved to: ${savePath}`);
    console.log(`Word count: ${wordCount}`);
    console.log("Use Read tool to analyze, then create extraction JSON.");
  } else {
    console.log("\n## Content\n");
    console.log(text);
  }
}

// ─── Main ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const urlArg = args.find((a) => !a.startsWith("--"));

  if (!urlArg) {
    console.error("Usage: ingest.ts <url-or-path> [--force]");
    process.exit(1);
  }

  // Normalize URL
  let url: string;
  try {
    url = normalizeUrl(urlArg);
  } catch {
    url = urlArg; // Local file path
  }

  // Duplicate detection
  if (!force) {
    const existing = await findSourceByUrl(url);
    if (existing) {
      console.error(`Source already ingested as ${existing}.`);
      console.error("Use --force to re-ingest.");
      process.exit(1);
    }
  }

  // Detect type
  let type;
  try {
    type = detectType(url);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  const domains = await listExistingDomains();

  // Route to handler
  switch (type) {
    case "youtube": {
      const { ingestYouTube } = await import("./lib/ingest/youtube");
      try {
        const result = await ingestYouTube(url);
        printMetadataHeader(result.sourceId, {
          Type: "YouTube",
          Title: result.metadata.title,
          Channel: result.metadata.channel,
          Duration: `${Math.floor(result.metadata.duration / 60)}:${String(Math.floor(result.metadata.duration % 60)).padStart(2, "0")}`,
          Views: result.metadata.viewCount,
          "Upload Date": result.metadata.uploadDate,
          Chapters: result.metadata.chapters.length,
          Transcript: result.metadata.hasManualSubs ? "manual" : "auto-generated",
          "Word count": result.wordCount,
          "Existing domains": domains,
        });
        await outputContent(
          result.cleanText,
          result.wordCount,
          result.rawPath.replace(".json3", ".clean.txt")
        );
      } catch (err) {
        console.error(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
      break;
    }

    case "blog": {
      const { extractArticle } = await import("./lib/ingest/blog");
      const { slugify } = await import("./lib/ingest/slug");
      const { generateSourceId } = await import("./lib/generate-id");

      const resp = await fetch(url, {
        signal: AbortSignal.timeout(10_000),
      }).catch(() => null);

      if (!resp || !resp.ok) {
        console.error("Request timed out or failed. Check URL and try again.");
        process.exit(1);
      }

      const html = await resp.text();
      const result = extractArticle(html, url);

      if (!result) {
        console.error(
          "Could not extract content (JS-rendered or paywalled page). Paste text manually."
        );
        process.exit(1);
      }

      const slug = slugify(result.metadata.title);
      const sourceId = generateSourceId(result.metadata.title);
      const today = new Date().toISOString().slice(0, 10);

      // Save raw HTML
      const rawDir = join(KB_ROOT, "sources", "blog", "raw");
      await mkdir(rawDir, { recursive: true });
      await writeFile(join(rawDir, `${slug}.html`), html, "utf-8");

      // Create source .md
      const sourceMd = [
        "---",
        `id: ${sourceId}`,
        `type: blog`,
        `title: "${result.metadata.title.replace(/"/g, '\\"')}"`,
        result.metadata.author ? `author: "${result.metadata.author.replace(/"/g, '\\"')}"` : null,
        `url: "${url}"`,
        `date_ingested: "${today}"`,
        `insight_count: 0`,
        result.metadata.siteName ? `site_name: "${result.metadata.siteName}"` : null,
        result.metadata.publishDate ? `publish_date: "${result.metadata.publishDate}"` : null,
        `word_count: ${result.wordCount}`,
        "---",
        "",
      ].filter(Boolean).join("\n");

      const sourceDir = join(KB_ROOT, "sources", "blog");
      await mkdir(sourceDir, { recursive: true });
      await writeFile(join(sourceDir, `${slug}.md`), sourceMd, "utf-8");

      printMetadataHeader(sourceId, {
        Type: "Blog",
        Title: result.metadata.title,
        Author: result.metadata.author || "Unknown",
        Site: result.metadata.siteName || "Unknown",
        "Publish Date": result.metadata.publishDate || "Unknown",
        "Word count": result.wordCount,
        "Existing domains": domains,
      });

      await outputContent(
        result.text,
        result.wordCount,
        join(rawDir, `${slug}.clean.txt`)
      );
      break;
    }

    case "reddit": {
      const { fetchRedditPost } = await import("./lib/ingest/reddit");
      const { slugify } = await import("./lib/ingest/slug");
      const { generateSourceId } = await import("./lib/generate-id");

      try {
        const post = await fetchRedditPost(url);
        const slug = slugify(post.title);
        const sourceId = generateSourceId(post.title);
        const today = new Date().toISOString().slice(0, 10);

        // Save raw
        const rawDir = join(KB_ROOT, "sources", "reddit", "raw");
        await mkdir(rawDir, { recursive: true });
        await writeFile(join(rawDir, `${slug}.json`), JSON.stringify(post, null, 2), "utf-8");

        // Create source .md
        const sourceMd = [
          "---",
          `id: ${sourceId}`,
          `type: reddit`,
          `title: "${post.title.replace(/"/g, '\\"')}"`,
          `author: "u/${post.author}"`,
          `url: "${url}"`,
          `subreddit: "${post.subreddit}"`,
          `date_ingested: "${today}"`,
          `insight_count: 0`,
          `score: ${post.score}`,
          `num_comments: ${post.numComments}`,
          "---",
          "",
        ].join("\n");

        const sourceDir = join(KB_ROOT, "sources", "reddit");
        await writeFile(join(sourceDir, `${slug}.md`), sourceMd, "utf-8");

        // Build clean text
        let cleanText = `# ${post.title}\n\nBy u/${post.author} in ${post.subreddit}\n\n${post.selftext}`;
        if (post.comments.length > 0) {
          cleanText += "\n\n## Top Comments\n\n";
          for (const c of post.comments) {
            cleanText += `**u/${c.author}** (${c.score} points):\n${c.body}\n\n`;
          }
        }

        const wordCount = cleanText.split(/\s+/).filter(Boolean).length;

        printMetadataHeader(sourceId, {
          Type: "Reddit",
          Title: post.title,
          Author: `u/${post.author}`,
          Subreddit: post.subreddit,
          Score: post.score,
          Comments: post.numComments,
          "Word count": wordCount,
          "Existing domains": domains,
        });

        await outputContent(cleanText, wordCount, join(rawDir, `${slug}.clean.txt`));
      } catch (err) {
        console.error(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
      break;
    }

    case "pdf": {
      const { ingestPdf } = await import("./lib/ingest/pdf");
      try {
        const result = await ingestPdf(url);
        console.log(`\nSUCCESS: Source created as ${result.sourceId}\n`);
        console.log(`PDF saved to: ${result.rawPath}`);
        console.log("Use Read tool to review, then create extraction JSON.");
      } catch (err) {
        console.error(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
      break;
    }
  }
}

main().catch((err) => {
  console.error("ingest.ts failed:", err);
  process.exit(1);
});
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsx -e "import './scripts/ingest'; console.log('OK')" 2>/dev/null || echo "Expected — script needs CLI args"`

- [ ] **Step 3: Commit**

```bash
git add scripts/ingest.ts
git commit -m "feat: add ingest.ts CLI — universal URL content fetcher"
```

---

## Task 15: End-to-End Smoke Test

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASS (both old and new tests)

- [ ] **Step 2: Run health check**

Run: `npx tsx scripts/health.ts`
Expected: PASS (existing knowledge base still valid)

- [ ] **Step 3: Test YouTube ingestion end-to-end**

Run:
```bash
npx tsx scripts/ingest.ts https://youtu.be/CxFQykWiJqY
```
Expected: Should print metadata + clean transcript for the Gumloop video. Should create source file and raw json3 file. Since this URL already exists as a source, it should warn about duplicate — test with `--force`:
```bash
npx tsx scripts/ingest.ts https://youtu.be/CxFQykWiJqY --force
```

- [ ] **Step 4: Revert smoke test artifacts**

```bash
git checkout knowledge-base/
```

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: Phase 6-7 complete — universal content ingestion pipeline"
```

---

## Summary

| Task | What | Estimated Steps |
|------|------|----------------|
| 1 | Install dependencies | 4 |
| 2 | Update generate-id.ts (salt) | 5 |
| 3 | Update SourceFrontmatter schema + health.ts | 5 |
| 4 | Create extraction schema | 3 |
| 5 | Create slug.ts | 5 |
| 6 | Create write-insights.ts (core) | 6 |
| 7 | Create extract.ts CLI | 3 |
| 8 | Create detect.ts | 5 |
| 9 | Create transcript-clean.ts | 6 |
| 10 | Create youtube.ts | 3 |
| 11 | Create blog.ts | 6 |
| 12 | Create reddit.ts | 6 |
| 13 | Create pdf.ts | 4 |
| 14 | Create ingest.ts CLI | 3 |
| 15 | End-to-end smoke test | 5 |
| **Total** | | **69 steps** |
