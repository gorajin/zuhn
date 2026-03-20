import Database from "better-sqlite3";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { mkdirSync } from "node:fs";
import type { InsightData } from "../schemas/frontmatter";

// ─── Paths ──────────────────────────────────────────────────────────

const KB_ROOT = join(__dirname, "../../knowledge-base");
const DB_DIR = join(KB_ROOT, "db");
const DB_PATH = join(DB_DIR, "brain.db");

// ─── Types ──────────────────────────────────────────────────────────

export interface InsightRow {
  id: string;
  domain: string;
  topic: string;
  subtopic: string | null;
  title: string;
  one_line: string;
  confidence: string;
  status: string;
  shelf_life: string;
  actionability: string;
  tags: string;
  file_path: string;
  content_hash: string;
  embedding_model: string | null;
  date_extracted: string | null;
  last_accessed: string | null;
  access_count: number;
}

// ─── initDb ─────────────────────────────────────────────────────────

/**
 * Opens (or creates) the SQLite database and ensures all tables,
 * virtual tables, and triggers exist.
 *
 * Pass a custom `dbPath` for testing (e.g. ":memory:").
 */
export function initDb(dbPath?: string): Database.Database {
  const resolvedPath = dbPath ?? DB_PATH;

  // Ensure the directory exists for on-disk databases
  if (resolvedPath !== ":memory:") {
    mkdirSync(join(resolvedPath, ".."), { recursive: true });
  }

  const db = new Database(resolvedPath);

  // Enable WAL mode for better concurrent read performance
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS insights (
      id TEXT PRIMARY KEY,
      domain TEXT NOT NULL,
      topic TEXT NOT NULL,
      subtopic TEXT,
      title TEXT NOT NULL,
      one_line TEXT NOT NULL,
      confidence TEXT DEFAULT 'pending',
      status TEXT DEFAULT 'active',
      shelf_life TEXT DEFAULT 'evergreen',
      actionability TEXT DEFAULT 'reference',
      -- NOTE: tags not in original spec schema but needed for FTS5 sync triggers
      tags TEXT NOT NULL,
      file_path TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      embedding_model TEXT,
      date_extracted TEXT,
      last_accessed TEXT,
      access_count INTEGER DEFAULT 0
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS insights_fts USING fts5(
      id,
      title,
      one_line,
      tags,
      content='insights',
      content_rowid='rowid',
      tokenize='porter unicode61'
    );

    -- Triggers to keep FTS in sync with the insights table
    CREATE TRIGGER IF NOT EXISTS insights_ai AFTER INSERT ON insights BEGIN
      INSERT INTO insights_fts(rowid, id, title, one_line, tags)
        VALUES (new.rowid, new.id, new.title, new.one_line, new.tags);
    END;

    CREATE TRIGGER IF NOT EXISTS insights_ad AFTER DELETE ON insights BEGIN
      INSERT INTO insights_fts(insights_fts, rowid, id, title, one_line, tags)
        VALUES('delete', old.rowid, old.id, old.title, old.one_line, old.tags);
    END;

    CREATE TRIGGER IF NOT EXISTS insights_au AFTER UPDATE ON insights BEGIN
      INSERT INTO insights_fts(insights_fts, rowid, id, title, one_line, tags)
        VALUES('delete', old.rowid, old.id, old.title, old.one_line, old.tags);
      INSERT INTO insights_fts(rowid, id, title, one_line, tags)
        VALUES (new.rowid, new.id, new.title, new.one_line, new.tags);
    END;
  `);

  return db;
}

// ─── upsertInsight ──────────────────────────────────────────────────

/**
 * Insert or replace an insight into the database.
 * Tags are stored as a space-separated string.
 * content_hash is SHA-256 of the one_line text.
 */
export function upsertInsight(
  db: Database.Database,
  insight: InsightData,
  filePath: string
): void {
  const oneLine = insight.resolutions.one_line;
  const contentHash = createHash("sha256").update(oneLine).digest("hex");
  const tags = insight.tags.join(" ");

  const stmt = db.prepare(`
    INSERT INTO insights (
      id, domain, topic, subtopic, title, one_line,
      confidence, status, shelf_life, actionability,
      tags, file_path, content_hash,
      date_extracted, last_accessed, access_count
    ) VALUES (
      @id, @domain, @topic, @subtopic, @title, @one_line,
      @confidence, @status, @shelf_life, @actionability,
      @tags, @file_path, @content_hash,
      @date_extracted, @last_accessed, @access_count
    )
    ON CONFLICT(id) DO UPDATE SET
      domain = excluded.domain,
      topic = excluded.topic,
      subtopic = excluded.subtopic,
      title = excluded.title,
      one_line = excluded.one_line,
      confidence = excluded.confidence,
      status = excluded.status,
      shelf_life = excluded.shelf_life,
      actionability = excluded.actionability,
      tags = excluded.tags,
      file_path = excluded.file_path,
      content_hash = excluded.content_hash,
      date_extracted = excluded.date_extracted,
      last_accessed = excluded.last_accessed,
      access_count = excluded.access_count
  `);

  stmt.run({
    id: insight.id,
    domain: insight.domain,
    topic: insight.topic,
    subtopic: insight.subtopic ?? null,
    title: insight.title,
    one_line: oneLine,
    confidence: insight.confidence,
    status: insight.status,
    shelf_life: insight.shelf_life,
    actionability: insight.actionability,
    tags,
    file_path: filePath,
    content_hash: contentHash,
    date_extracted: insight.date_extracted,
    last_accessed: insight.last_accessed ?? null,
    access_count: insight.access_count,
  });
}

// ─── getInsightById ─────────────────────────────────────────────────

/**
 * Fetch a single insight by ID.
 */
export function getInsightById(
  db: Database.Database,
  id: string
): InsightRow | undefined {
  const stmt = db.prepare("SELECT * FROM insights WHERE id = ?");
  return stmt.get(id) as InsightRow | undefined;
}

// ─── getAllInsights ──────────────────────────────────────────────────

/**
 * Fetch all insights from the database.
 */
export function getAllInsights(db: Database.Database): InsightRow[] {
  const stmt = db.prepare("SELECT * FROM insights");
  return stmt.all() as InsightRow[];
}
