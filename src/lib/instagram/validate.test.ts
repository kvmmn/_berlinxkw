import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { countHashtags, validateCaption, validateVideoUrl } from "./validate";

const FIXTURE_MP4 = join(process.cwd(), "data/fixtures/instagram/publish-sample.mp4");

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
    let called = false;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      called = true;
      return new Response(null, { status: 200 });
    };

    try {
      const r = await validateVideoUrl("http://example.com/video.mp4");
      assert.equal(r.ok, false);
      assert.match(r.errors.join(" "), /HTTPS/i);
      assert.equal(called, false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("probes MP4 metadata and enforces Reels duration minimum", async () => {
    const bytes = readFileSync(FIXTURE_MP4);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (_url, init) => {
      const range =
        init && typeof init === "object" && init.headers
          ? new Headers(init.headers as HeadersInit).get("Range")
          : null;
      if (range) {
        return new Response(bytes, {
          status: 206,
          headers: { "content-type": "video/mp4" },
        });
      }
      return new Response(null, {
        status: 200,
        headers: {
          "content-type": "video/mp4",
          "content-length": String(bytes.length),
        },
      });
    };

    try {
      const r = await validateVideoUrl("https://cdn.example.com/reel.mp4");
      assert.equal(r.ok, false);
      assert.match(r.errors.join(" "), /duration/i);
      assert.equal(r.contentLength, bytes.length);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("accepts partial content 206 for HEAD probe", async () => {
    const bytes = readFileSync(FIXTURE_MP4);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (_url, init) => {
      const method = init?.method ?? "GET";
      if (method === "HEAD") {
        return new Response(null, {
          status: 206,
          headers: {
            "content-type": "video/mp4",
            "content-length": String(bytes.length),
          },
        });
      }
      return new Response(bytes, {
        status: 206,
        headers: { "content-type": "video/mp4" },
      });
    };

    try {
      const r = await validateVideoUrl("https://cdn.example.com/reel.mp4");
      assert.equal(r.contentLength, bytes.length);
      assert.match(r.errors.join(" "), /duration/i);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
