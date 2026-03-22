export type ContentType = "youtube" | "reddit" | "blog" | "pdf" | "audio" | "image";

const TRACKING_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref", "si", "source"];

const AUDIO_EXTENSIONS = [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac", ".webm"];
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".heic", ".webp", ".gif", ".svg", ".tiff"];

export function normalizeUrl(urlString: string): string {
  const url = new URL(urlString);
  if (url.hostname === "m.youtube.com") url.hostname = "www.youtube.com";
  for (const param of TRACKING_PARAMS) url.searchParams.delete(param);
  const result = url.toString();
  return result.endsWith("?") ? result.slice(0, -1) : result;
}

function isLocalPath(input: string): boolean {
  return !input.startsWith("http://") && !input.startsWith("https://");
}

export function detectType(input: string): ContentType {
  // Handle local file paths before trying URL parsing
  if (isLocalPath(input)) {
    const lower = input.toLowerCase();
    if (AUDIO_EXTENSIONS.some((ext) => lower.endsWith(ext))) return "audio";
    if (IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))) return "image";
    if (lower.endsWith(".pdf")) return "pdf";
    throw new Error(`Unsupported local file type: ${input}`);
  }

  const url = new URL(input);
  const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");

  if (host === "youtube.com" || host === "youtu.be") {
    if (url.pathname === "/playlist") {
      throw new Error("This is a playlist. Pass individual video URLs.");
    }
    return "youtube";
  }
  if (host === "reddit.com" || host === "old.reddit.com") return "reddit";
  if (url.pathname.toLowerCase().endsWith(".pdf")) return "pdf";
  return "blog";
}
