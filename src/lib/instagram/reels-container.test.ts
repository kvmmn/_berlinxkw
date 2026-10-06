import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fetchReelsContainerStatusCode, isReelsContainerPublished } from "./reels-container";

describe("reels container status (S2-a)", () => {
  it("uses status_code only and treats PUBLISHED as live", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input) => {
      const url = String(input);
      if (url.includes("ig_id") || url.includes("permalink")) {
        return new Response(
          JSON.stringify({ error: { message: "Unknown field", code: 100 } }),
          { status: 400, headers: { "content-type": "application/json" } },
        );
      }
      if (url.includes("fields=status_code")) {
        return new Response(JSON.stringify({ status_code: "PUBLISHED", id: "ctr-1" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: { message: "unmocked" } }), { status: 500 });
    };

    try {
      assert.equal(await fetchReelsContainerStatusCode("ctr-1", "token"), "PUBLISHED");
      assert.equal(await isReelsContainerPublished("ctr-1", "token"), true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
