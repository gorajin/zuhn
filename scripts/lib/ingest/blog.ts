import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export interface ArticleMetadata {
  title: string;
  author: string | null;
  siteName: string | null;
  publishDate: string | null;
}

export interface ArticleResult {
  text: string;
  wordCount: number;
  metadata: ArticleMetadata;
}

const MIN_CONTENT_LENGTH = 200;

function extractMetadata(doc: Document, readabilityTitle: string | null): ArticleMetadata {
  // JSON-LD
  const jsonLdEl = doc.querySelector('script[type="application/ld+json"]');
  let jsonLd: Record<string, string> | null = null;
  if (jsonLdEl?.textContent) {
    try {
      jsonLd = JSON.parse(jsonLdEl.textContent);
    } catch {
      // ignore malformed JSON-LD
    }
  }

  // OpenGraph helpers
  const og = (prop: string): string | null =>
    doc.querySelector(`meta[property="og:${prop}"]`)?.getAttribute("content") ?? null;

  const meta = (name: string): string | null =>
    doc.querySelector(`meta[name="${name}"]`)?.getAttribute("content") ?? null;

  const articleMeta = (prop: string): string | null =>
    doc.querySelector(`meta[property="article:${prop}"]`)?.getAttribute("content") ?? null;

  // Cascade: JSON-LD > OpenGraph > meta tags > Readability
  const title =
    (jsonLd as Record<string, string> | null)?.headline ??
    og("title") ??
    meta("title") ??
    readabilityTitle ??
    doc.title ??
    "";

  const author =
    (jsonLd as Record<string, string> | null)?.author ??
    meta("author") ??
    null;

  const siteName =
    (jsonLd as Record<string, string> | null)?.publisher ??
    og("site_name") ??
    null;

  const publishDate =
    (jsonLd as Record<string, string> | null)?.datePublished ??
    articleMeta("published_time") ??
    meta("date") ??
    null;

  return { title, author, siteName, publishDate };
}

export function extractArticle(html: string, url: string): ArticleResult | null {
  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;

  // Clone document for Readability (it mutates the DOM)
  const clonedDoc = doc.cloneNode(true) as Document;
  const reader = new Readability(clonedDoc);
  const article = reader.parse();

  if (!article?.textContent) return null;

  const text = article.textContent.trim();
  if (text.length < MIN_CONTENT_LENGTH) return null;

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const metadata = extractMetadata(doc, article.title ?? null);

  return { text, wordCount, metadata };
}
