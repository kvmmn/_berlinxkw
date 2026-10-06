import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  assertProbeUrlAllowed,
  isAllowedProbeHostname,
  PROBE_VIDEO_META_MAX_BYTES,
  readResponseBodyCapped,
  safeProbeFetch,
} from "./probe-fetch";

const FIXTURE_MP4 = join(process.cwd(), "data/fixtures/instagram/publish-sample.mp4");
const ALLOWED_VIDEO =
  "https://berlinxkw.vercel.app/api/shop/media?pathname=berlinxkw/instagram/demo/publish-sample.mp4";

describe("probe-fetch allowlist", () => {
  it("allows berlinxkw.vercel.app and blob hosts", () => {
    assert.equal(isAllowedProbeHostname("berlinxkw.vercel.app"), true);
    assert.equal(isAllowedProbeHostname("abc.public.blob.vercel-storage.com"), true);
    assert.equal(isAllowedProbeHostname("evil.example.com"), false);
  });

  it("rejects disallowed host without fetching", async () => {
    let called = false;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      called = true;
      return new Response(null, { status: 200 });
    };

    try {
      assert.throws(
        () => assertProbeUrlAllowed("https://cdn.example.com/video.mp4"),
        /not allowed/i,
      );
      assert.equal(called, false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("rejects redirects to loopback before following", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(null, {
        status: 302,
        headers: { location: "http://127.0.0.1:3917/secret.mp4" },
      });

    try {
      await assert.rejects(
        () =>
          safeProbeFetch(ALLOWED_VIDEO, {
            method: "HEAD",
          }),
        /redirect/i,
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("does not read more than max bytes when Range is ignored", async () => {
    const bytes = readFileSync(FIXTURE_MP4);
    const huge = Buffer.alloc(Math.max(bytes.length + 1, PROBE_VIDEO_META_MAX_BYTES + 4096), 0x61);
    huge.set(bytes.subarray(0, Math.min(bytes.length, 64)), 0);

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(huge, {
        status: 200,
        headers: { "content-type": "video/mp4" },
      });

    try {
      const { body } = await safeProbeFetch(ALLOWED_VIDEO, {
        method: "GET",
        maxBodyBytes: PROBE_VIDEO_META_MAX_BYTES,
      });
      assert.equal(body.length, PROBE_VIDEO_META_MAX_BYTES);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("readResponseBodyCapped", () => {
  it("stops at cap on streaming bodies", async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(100_000));
        controller.enqueue(new Uint8Array(100_000));
        controller.close();
      },
    });
    const res = new Response(stream);
    const buf = await readResponseBodyCapped(res, 50_000);
    assert.equal(buf.length, 50_000);
  });
});
