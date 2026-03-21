import { JSDOM } from "jsdom";

export interface RedditComment {
  author: string;
  body: string;
  score: number;
}

export interface RedditPost {
  title: string;
  author: string;
  subreddit: string;
  body: string;
  score: number;
  numComments: number;
  createdUtc: number;
  comments: RedditComment[];
}

/**
 * Parse Reddit's JSON API response into a structured RedditPost.
 * The API returns an array of two listings:
 *   [0] = post listing, [1] = comment listing
 */
export function parseRedditJson(data: unknown[]): RedditPost {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const postListing = data[0] as any;
  const postData = postListing.data.children[0].data;

  const title: string = postData.title ?? "";
  const author: string = postData.author ?? "[deleted]";
  const subreddit: string = postData.subreddit_name_prefixed ?? "";
  const body: string = postData.selftext ?? "";
  const score: number = postData.score ?? 0;
  const numComments: number = postData.num_comments ?? 0;
  const createdUtc: number = postData.created_utc ?? 0;

  // Extract comments from the second listing, filtering out deleted users
  const comments: RedditComment[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const commentListing = data[1] as any;
  if (commentListing?.data?.children) {
    for (const child of commentListing.data.children) {
      if (child.kind !== "t1") continue;
      const c = child.data;
      if (c.author === "[deleted]") continue;
      comments.push({
        author: c.author,
        body: c.body,
        score: c.score ?? 0,
      });
    }
  }

  return { title, author, subreddit, body, score, numComments, createdUtc, comments };
}

const USER_AGENT = "BrainEngine-LocalIngest/1.0 (by /u/chlwlsdud)";

/**
 * Extract post content from old.reddit.com HTML as a fallback.
 */
function parseOldRedditHtml(html: string): RedditPost {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  // Title from <title> tag — old reddit format: "title : subreddit"
  const rawTitle = doc.querySelector("title")?.textContent ?? "";
  const title = rawTitle.replace(/\s*:\s*\w+\s*$/, "").trim();

  // Body from .usertext-body
  const bodyEl = doc.querySelector(".usertext-body");
  const body = bodyEl?.textContent?.trim() ?? "";

  return {
    title,
    author: "",
    subreddit: "",
    body,
    score: 0,
    numComments: 0,
    createdUtc: 0,
    comments: [],
  };
}

/**
 * Fetch a Reddit post with three-tier fallback:
 * 1. JSON API (append .json to URL)
 * 2. old.reddit.com HTML scraping
 * 3. Throw with instruction to paste content manually
 */
export async function fetchRedditPost(url: string): Promise<RedditPost> {
  const headers = { "User-Agent": USER_AGENT };

  // Tier 1: JSON API
  try {
    const jsonUrl = url.replace(/\/?$/, ".json");
    const res = await fetch(jsonUrl, { headers });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length >= 2) {
        return parseRedditJson(data);
      }
    }
  } catch {
    // Fall through to tier 2
  }

  // Tier 2: old.reddit.com HTML
  try {
    const parsed = new URL(url);
    const oldRedditUrl = `https://old.reddit.com${parsed.pathname}`;
    const res = await fetch(oldRedditUrl, { headers });
    if (res.ok) {
      const html = await res.text();
      return parseOldRedditHtml(html);
    }
  } catch {
    // Fall through to tier 3
  }

  // Tier 3: give up
  throw new Error(
    "Reddit blocked automated access. Paste the post content into conversation.",
  );
}
