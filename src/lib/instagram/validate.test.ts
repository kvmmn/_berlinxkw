import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { PROBE_FETCH_TIMEOUT_MS } from "./probe-fetch";
import {
  countHashtags,
  validateCaption,
  validatePublishPayload,
  validateVideoUrl,
} from "./validate";

const FIXTURE_MP4 = join(process.cwd(), "data/fixtures/instagram/publish-sample.mp4");
const FIXTURE_JPEG = join(process.cwd(), "public", "shop", "demo", "publish-sample.jpg");
const ALLOWED_VIDEO =
  "https://berlinxkw.vercel.app/api/shop/media?pathname=berlinxkw/instagram/demo/publish-sample.mp4";
const ALLOWED_IMAGE =
  "https://berlinxkw.vercel.app/api/shop/media?pathname=berlinxkw/instagram/demo/publish-sample.jpg";

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

describe("validatePublishPayload dryRun image probe (R1)", () => {
  it("dryRun uses SSRF-safe probe fetch (no redirect follow)", async () => {
    let sawManualRedirect = false;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (_url, init) => {
      const redirect = init && typeof init === "object" ? init.redirect : undefined;
      if (redirect === "manual") sawManualRedirect = true;
      return new Response(null, {
        status: 302,
        headers: { location: "https://evil.example.com/image.jpg" },
      });
    };

    try {
      const r = await validatePublishPayload([ALLOWED_IMAGE], "caption", { dryRun: true });
      assert.equal(r.ok, false);
      assert.equal(sawManualRedirect, true);
      assert.match(r.errors.join(" "), /redirect/i);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("dryRun aborts slow image probes at PROBE_FETCH_TIMEOUT_MS", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (_url, init) => {
      const signal = init?.signal;
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => resolve(), PROBE_FETCH_TIMEOUT_MS + 5_000);
        signal?.addEventListener(
          "abort",
          () => {
            clearTimeout(timer);
            const err = new Error("The operation was aborted");
            err.name = "TimeoutError";
            reject(err);
          },
          { once: true },
        );
      });
      return new Response(null, { status: 200 });
    };

    const started = Date.now();
    try {
      const r = await validatePublishPayload([ALLOWED_IMAGE], "caption", { dryRun: true });
      assert.equal(r.ok, false);
      assert.match(r.images[0]?.errors.join(" ") ?? "", /fetch/i);
      assert.ok(Date.now() - started < PROBE_FETCH_TIMEOUT_MS + 3_000);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("dryRun reads JPEG dimensions from allowlisted shop media", async () => {
    const bytes = readFileSync(FIXTURE_JPEG);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(bytes, {
        status: 206,
        headers: { "content-type": "image/jpeg" },
      });

    try {
      const r = await validatePublishPayload([ALLOWED_IMAGE], "caption", { dryRun: true });
      assert.equal(r.ok, true);
      assert.equal(r.images[0]?.contentType, "image/jpeg");
      assert.ok((r.images[0]?.width ?? 0) > 0);
    } finally {
      globalThis.fetch = originalFetch;
    }
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
      const r = await validateVideoUrl(ALLOWED_VIDEO);
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
      const r = await validateVideoUrl(ALLOWED_VIDEO);
      assert.equal(r.contentLength, bytes.length);
      assert.match(r.errors.join(" "), /duration/i);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
