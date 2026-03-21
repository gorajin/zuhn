import { execFileSync } from "node:child_process";
import { join, basename, extname } from "node:path";
import { readFile, mkdir, copyFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import matter from "gray-matter";
import { generateSourceId } from "../generate-id";
import { slugify } from "./slug";

// ─── Types ──────────────────────────────────────────────────────────────

export interface AudioMetadata {
  title: string;
  duration: string; // "MM:SS" format
  language: string;
}

export interface AudioResult {
  sourceId: string;
  sourcePath: string;
  rawPath: string;
  cleanText: string;
  wordCount: number;
  metadata: AudioMetadata;
}

// ─── Constants ──────────────────────────────────────────────────────────

const SUPPORTED_EXTENSIONS = [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac", ".webm"];

// ─── Helpers ────────────────────────────────────────────────────────────

function resolveWhisper(): string {
  try {
    execFileSync("which", ["whisper"], { stdio: "pipe" });
    return "whisper";
  } catch {
    throw new Error(
      "Whisper not found. Install with: pipx install openai-whisper",
    );
  }
}

function resolveFfprobe(): string {
  try {
    execFileSync("which", ["ffprobe"], { stdio: "pipe" });
    return "ffprobe";
  } catch {
    throw new Error(
      "ffmpeg not found. Install with: brew install ffmpeg",
    );
  }
}

function getDuration(filePath: string): string {
  const ffprobe = resolveFfprobe();
  const stdout = execFileSync(
    ffprobe,
    ["-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", filePath],
    { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
  ).trim();

  const totalSeconds = Math.round(parseFloat(stdout));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

interface WhisperSegment {
  start: number;
  end: number;
  text: string;
}

interface WhisperOutput {
  text: string;
  segments: WhisperSegment[];
  language: string;
}

function transcribe(filePath: string): WhisperOutput {
  const whisper = resolveWhisper();
  const outputDir = join(tmpdir(), `whisper-${Date.now()}`);

  execFileSync(
    whisper,
    [filePath, "--model", "base", "--language", "en", "--output_format", "json", "--output_dir", outputDir],
    { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"], maxBuffer: 50 * 1024 * 1024 },
  );

  // Whisper writes {basename_without_ext}.json in output_dir
  const base = basename(filePath);
  const ext = extname(base);
  const jsonName = base.slice(0, base.length - ext.length) + ".json";
  const jsonPath = join(outputDir, jsonName);

  const raw = require("fs").readFileSync(jsonPath, "utf-8");
  return JSON.parse(raw) as WhisperOutput;
}

function buildCleanText(segments: WhisperSegment[]): string {
  if (segments.length === 0) return "";

  const paragraphs: string[] = [];
  let currentParagraph: string[] = [];

  for (let i = 0; i < segments.length; i++) {
    const text = segments[i].text.trim();
    if (!text) continue;

    currentParagraph.push(text);

    // Insert paragraph break if gap to next segment is > 3 seconds
    const nextSegment = segments[i + 1];
    if (nextSegment && nextSegment.start - segments[i].end > 3) {
      paragraphs.push(currentParagraph.join(" "));
      currentParagraph = [];
    }
  }

  // Flush remaining
  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph.join(" "));
  }

  return paragraphs.join("\n\n");
}

function titleFromFilename(filePath: string): string {
  const base = basename(filePath);
  const ext = extname(base);
  return base.slice(0, base.length - ext.length).replace(/[-_]+/g, " ").trim();
}

// ─── Main ───────────────────────────────────────────────────────────────

export async function ingestAudio(
  filePath: string,
  kbRoot?: string,
): Promise<AudioResult> {
  const root = kbRoot ?? join(__dirname, "../../..", "knowledge-base");

  // 1. Verify file exists
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  // 2. Verify supported format
  const ext = extname(filePath).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    throw new Error(
      `Unsupported audio format "${ext}". Supported: ${SUPPORTED_EXTENSIONS.join(", ")}`,
    );
  }

  // 3. Derive title and slug
  const title = titleFromFilename(filePath);
  const slug = slugify(title);

  // 4. Copy audio to raw directory
  const rawDir = join(root, "sources", "audio", "raw");
  const sourceDir = join(root, "sources", "audio");
  await mkdir(rawDir, { recursive: true });
  await mkdir(sourceDir, { recursive: true });

  const rawPath = join(rawDir, `${slug}${ext}`);
  await copyFile(filePath, rawPath);

  // 5. Get duration via ffprobe
  const duration = getDuration(filePath);

  // 6. Transcribe via Whisper
  const whisperResult = transcribe(filePath);

  // 7. Build clean text with paragraph breaks
  const cleanText = buildCleanText(whisperResult.segments);
  const wordCount = cleanText.split(/\s+/).filter(Boolean).length;

  // 8. Generate source ID and write source .md
  const sourceId = generateSourceId(title);
  const today = new Date().toISOString().slice(0, 10);

  const sourceData: Record<string, string | number> = {
    id: sourceId,
    type: "audio",
    title,
    date_ingested: today,
    insight_count: 0,
    duration,
    word_count: wordCount,
  };

  const sourceMd = matter.stringify(cleanText, sourceData);
  const sourcePath = join(sourceDir, `${slug}.md`);
  await writeFile(sourcePath, sourceMd, "utf-8");

  return {
    sourceId,
    sourcePath,
    rawPath,
    cleanText,
    wordCount,
    metadata: {
      title,
      duration,
      language: whisperResult.language ?? "en",
    },
  };
}
