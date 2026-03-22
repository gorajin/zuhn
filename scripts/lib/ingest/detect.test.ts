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
  it("detects audio files by extension", () => {
    expect(detectType("/path/to/conference-talk.mp3")).toBe("audio");
    expect(detectType("/path/to/recording.m4a")).toBe("audio");
    expect(detectType("/path/to/voice-memo.wav")).toBe("audio");
  });
  it("detects various audio formats", () => {
    expect(detectType("/recordings/talk.aac")).toBe("audio");
    expect(detectType("/recordings/talk.ogg")).toBe("audio");
    expect(detectType("/recordings/talk.flac")).toBe("audio");
    expect(detectType("/recordings/talk.webm")).toBe("audio");
  });
  it("detects image files by extension", () => {
    expect(detectType("/path/to/slide.jpg")).toBe("image");
    expect(detectType("/path/to/whiteboard.png")).toBe("image");
    expect(detectType("/path/to/photo.heic")).toBe("image");
  });
  it("detects local PDF paths", () => {
    expect(detectType("/path/to/document.pdf")).toBe("pdf");
  });
  it("throws for unsupported local file types", () => {
    expect(() => detectType("/path/to/file.txt")).toThrow(/Unsupported local file type/);
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
