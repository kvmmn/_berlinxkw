import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { countHashtags, validateCaption, validateVideoUrl } from "./validate";

describe("validateCaption", () => {
  it("accepts normal captions", () => {
    const r = validateCaption("berlin × kawe #archive");
    assert.equal(r.ok, true);
    assert.equal(r.hashtagCount, 1);
  });

  it("rejects too many hashtags", () => {
    const tags = Array.from({ length: 31 }, (_, i) => `#tag${i}`).join(" ");
    const r = validateCaption(tags);
    assert.equal(r.ok, false);
    assert.equal(r.hashtagCount, 31);
  });

  it("counts unicode hashtags", () => {
    assert.equal(countHashtags("#برلین #berlin"), 2);
  });
});

describe("validateVideoUrl", () => {
  it("rejects non-HTTPS URLs without fetching", async () => {
    const r = await validateVideoUrl("http://example.com/video.mp4");
    assert.equal(r.ok, false);
    assert.match(r.errors.join(" "), /HTTPS/i);
  });

  it("accepts HTTPS MP4 with 200 and content-length", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(null, {
        status: 200,
        headers: {
          "content-type": "video/mp4",
          "content-length": "1024",
        },
      });

    try {
      const r = await validateVideoUrl("https://cdn.example.com/reel.mp4");
      assert.equal(r.ok, true);
      assert.equal(r.contentLength, 1024);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("accepts partial content 206", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(new Uint8Array([0]), {
        status: 206,
        headers: {
          "content-type": "video/mp4",
          "content-length": "1",
        },
      });

    try {
      const r = await validateVideoUrl("https://cdn.example.com/reel.mp4");
      assert.equal(r.ok, true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
