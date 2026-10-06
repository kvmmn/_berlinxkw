import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  REELS_CONTAINER_POLL_DEADLINE_MS,
  REELS_PUBLISH_CHECKBACK_DEADLINE_MS,
} from "./constants";
import {
  fetchReelsContainerStatusCode,
  isReelsContainerPublished,
  PUBLISH_RECONCILE_BACKOFF_MS,
  publishReconcileBackoffMs,
  reelsPublishCheckbackDeadlineAt,
  waitForReelsContainerPublishedAfterFailure,
} from "./reels-container";

describe("reels container status (S2-a)", () => {
  it("uses status_code,status and treats PUBLISHED as live", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input) => {
      const url = String(input);
      if (url.includes("ig_id") || url.includes("permalink")) {
        return new Response(
          JSON.stringify({ error: { message: "Unknown field", code: 100 } }),
          { status: 400, headers: { "content-type": "application/json" } },
        );
      }
      if (url.includes("status_code") && url.includes("status") && !url.includes("ig_id")) {
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

describe("reels publish check-back deadline (R1)", () => {
  it("uses a longer check-back cut-off than container polling", () => {
    assert.equal(REELS_PUBLISH_CHECKBACK_DEADLINE_MS, 280_000);
    assert.ok(REELS_PUBLISH_CHECKBACK_DEADLINE_MS > REELS_CONTAINER_POLL_DEADLINE_MS);
    const started = 1_700_000_000_000;
    assert.equal(
      reelsPublishCheckbackDeadlineAt(started),
      started + REELS_PUBLISH_CHECKBACK_DEADLINE_MS,
    );
  });

  it("extends reconcile backoffs beyond the original ~4.5s window", () => {
    assert.equal(publishReconcileBackoffMs(0), 500);
    assert.equal(publishReconcileBackoffMs(2), 2500);
    assert.ok(publishReconcileBackoffMs(3) >= 4000);
    assert.equal(
      publishReconcileBackoffMs(99),
      publishReconcileBackoffMs(PUBLISH_RECONCILE_BACKOFF_MS.length - 1),
    );
  });

  it("does not start check-backs after the check-back cut-off", async () => {
    let calls = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      calls += 1;
      return new Response(JSON.stringify({ status_code: "IN_PROGRESS" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };

    const startedAtMs = Date.now() - REELS_PUBLISH_CHECKBACK_DEADLINE_MS - 1;

    try {
      const ok = await waitForReelsContainerPublishedAfterFailure("ctr-late", "token", startedAtMs);
      assert.equal(ok, false);
      assert.equal(calls, 0, "should not poll Graph after check-back deadline");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("still reconciles when publish fails after the container poll deadline", async () => {
    const originalFetch = globalThis.fetch;
    const startedAtMs = Date.now() - REELS_CONTAINER_POLL_DEADLINE_MS - 500;
    let calls = 0;

    globalThis.fetch = async () => {
      calls += 1;
      const code = calls >= 2 ? "PUBLISHED" : "IN_PROGRESS";
      return new Response(JSON.stringify({ status_code: code, id: "ctr-1" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };

    try {
      const ok = await waitForReelsContainerPublishedAfterFailure("ctr-1", "token", startedAtMs);
      assert.equal(ok, true);
      assert.ok(calls >= 2);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it(
    "catches PUBLISHED flips more than ~4.5s after publish timeout",
    { timeout: 20_000 },
    async () => {
    const originalFetch = globalThis.fetch;
    const startedAtMs = Date.now();
    const enteredAt = Date.now();
    let calls = 0;

    globalThis.fetch = async () => {
      calls += 1;
      const elapsed = Date.now() - enteredAt;
      const code = elapsed >= 6000 ? "PUBLISHED" : "IN_PROGRESS";
      return new Response(JSON.stringify({ status_code: code, id: "ctr-1" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };

    try {
      const ok = await waitForReelsContainerPublishedAfterFailure("ctr-1", "token", startedAtMs);
      assert.equal(ok, true);
      assert.ok(calls >= 2);
    } finally {
      globalThis.fetch = originalFetch;
    }
  },
  );
});
