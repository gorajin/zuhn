export interface Chapter {
  title: string;
  startMs: number;
  endMs: number;
}

export interface CleanResult {
  text: string;
  wordCount: number;
}

interface Seg {
  utf8?: string;
}

interface Event {
  tStartMs: number;
  segs?: Seg[];
  utf8?: string;
}

interface Json3 {
  events: Event[];
}

const STRIP_MARKERS = /\[(music|applause|laughter)\]/gi;
const GAP_THRESHOLD_MS = 3000;

function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function extractText(event: Event): string {
  if (event.segs) {
    return event.segs.map((s) => s.utf8 || "").join("");
  }
  return event.utf8 || "";
}

function stripMarkers(text: string): string {
  return text.replace(STRIP_MARKERS, "");
}

export function cleanTranscript(raw: string, chapters?: Chapter[]): CleanResult {
  const json: Json3 = JSON.parse(raw);
  const events = json.events || [];

  // Build chapter index: map from event start time to chapter header
  const chapterHeaders = new Map<number, string>();
  if (chapters && chapters.length > 0) {
    for (const ch of chapters) {
      const header = `## ${ch.title} (${formatTimestamp(ch.startMs)}–${formatTimestamp(ch.endMs)})`;
      chapterHeaders.set(ch.startMs, header);
    }
  }

  const parts: string[] = [];
  let prevEndMs = 0;
  let currentChapterIdx = 0;

  for (const event of events) {
    const text = stripMarkers(extractText(event)).trim();
    if (!text) continue;

    // Insert chapter headers before any event that falls within a new chapter
    if (chapters && chapters.length > 0) {
      while (
        currentChapterIdx < chapters.length &&
        event.tStartMs >= chapters[currentChapterIdx].startMs
      ) {
        const ch = chapters[currentChapterIdx];
        const header = `## ${ch.title} (${formatTimestamp(ch.startMs)}–${formatTimestamp(ch.endMs)})`;
        parts.push(header);
        currentChapterIdx++;
      }
    }

    // Insert paragraph break for gaps > 3s
    if (parts.length > 0 && event.tStartMs - prevEndMs > GAP_THRESHOLD_MS) {
      // Only add paragraph break if the last part isn't already a chapter header
      const lastPart = parts[parts.length - 1];
      if (!lastPart.startsWith("## ")) {
        parts.push("");
      }
    }

    parts.push(text);
    prevEndMs = event.tStartMs;
  }

  const fullText = parts.join("\n");
  const wordCount = fullText
    .split(/\s+/)
    .filter((w) => w.length > 0 && !w.startsWith("##"))
    .length;

  return { text: fullText, wordCount };
}
