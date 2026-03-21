export type ContentType = "youtube" | "reddit" | "blog" | "pdf";

const TRACKING_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref", "si", "source"];

export function normalizeUrl(urlString: string): string {
  const url = new URL(urlString);
  if (url.hostname === "m.youtube.com") url.hostname = "www.youtube.com";
  for (const param of TRACKING_PARAMS) url.searchParams.delete(param);
  const result = url.toString();
  return result.endsWith("?") ? result.slice(0, -1) : result;
}

export function detectType(urlString: string): ContentType {
  const url = new URL(urlString);
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
