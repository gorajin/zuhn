import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseRedditJson } from "./reddit";

const FIXTURE_PATH = join(__dirname, "../../../tests/fixtures/ingest/sample-reddit.json");

describe("parseRedditJson", () => {
  it("extracts post title, author, subreddit, and score", async () => {
    const raw = JSON.parse(await readFile(FIXTURE_PATH, "utf-8"));
    const post = parseRedditJson(raw);
    expect(post.title).toBe("Test Reddit Post Title");
    expect(post.author).toBe("testuser");
    expect(post.subreddit).toBe("r/testsubreddit");
    expect(post.score).toBe(142);
  });

  it("extracts post body text", async () => {
    const raw = JSON.parse(await readFile(FIXTURE_PATH, "utf-8"));
    const post = parseRedditJson(raw);
    expect(post.body).toBe("This is the body of the test post with some content.");
  });

  it("extracts non-deleted comments (skips [deleted] authors)", async () => {
    const raw = JSON.parse(await readFile(FIXTURE_PATH, "utf-8"));
    const post = parseRedditJson(raw);
    expect(post.comments).toHaveLength(2);
    expect(post.comments[0].author).toBe("commenter1");
    expect(post.comments[0].body).toBe("Great post, very insightful!");
    expect(post.comments[0].score).toBe(45);
    expect(post.comments[1].author).toBe("commenter2");
    expect(post.comments[1].body).toBe("I disagree with point three.");
    expect(post.comments[1].score).toBe(12);
  });

  it("returns correct numComments from post metadata", async () => {
    const raw = JSON.parse(await readFile(FIXTURE_PATH, "utf-8"));
    const post = parseRedditJson(raw);
    expect(post.numComments).toBe(23);
  });

  it("extracts createdUtc timestamp", async () => {
    const raw = JSON.parse(await readFile(FIXTURE_PATH, "utf-8"));
    const post = parseRedditJson(raw);
    expect(post.createdUtc).toBe(1710000000);
  });
});
