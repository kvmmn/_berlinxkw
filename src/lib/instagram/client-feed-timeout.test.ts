import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { IG_GRAPH_FETCH_TIMEOUT_MS } from "./constants";
import { igFetch } from "./graph-fetch";

describe("feed publish Graph timeouts (B1)", () => {
  it("igFetch without timeoutMs allows media_publish slower than 15s (feed parity with main)", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      const url = String(input);
      const method = (init?.method ?? "GET").toUpperCase();
      if (method === "POST" && url.includes("media_publish")) {
        await new Promise((r) => setTimeout(r, 16_000));
        return new Response(JSON.stringify({ id: "published-media-999" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: { message: "unexpected" } }), { status: 500 });
    };

    try {
      const res = await igFetch<{ id: string }>("17841400000000000/media_publish", "test-token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "creation_id=container-1",
      });
      assert.equal(res.id, "published-media-999");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("igFetch with Reels timeoutMs aborts slow Graph calls", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (_input, init) => {
      const signal = init?.signal;
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => resolve(), 5_000);
        signal?.addEventListener(
          "abort",
          () => {
            clearTimeout(timer);
            const err = new Error("The operation was aborted");
            err.name = "AbortError";
            reject(err);
          },
          { once: true },
        );
      });
      return new Response(JSON.stringify({ id: "late" }), { status: 200 });
    };

    const started = Date.now();
    try {
      await assert.rejects(
        () =>
          igFetch("17841400000000000/media_publish", "test-token", {
            method: "POST",
            timeoutMs: 1_000,
          }),
        (err: unknown) => err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError"),
      );
      assert.ok(Date.now() - started < 3_000, "should abort near timeoutMs, not wait for full mock delay");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("Reels timeout constant remains 15s", () => {
    assert.equal(IG_GRAPH_FETCH_TIMEOUT_MS, 15_000);
  });
});
