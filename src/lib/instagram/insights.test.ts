import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  executeInsightsQuery,
  fetchAccountDailyInsights,
  parseInsightsQuery,
  parseMediaIdsParam,
} from "@/lib/instagram/insights";
import {
  INSIGHTS_METHOD_NOT_ALLOWED_STATUS,
  insightsMethodNotAllowedBody,
} from "@/lib/instagram/insights-http";
import { authorizeInstagramInsights } from "@/lib/instagram/publish-auth";

const TEST_PUBLISH_SECRET = "insights-test-publish-secret";
const TEST_ACCESS_TOKEN = "IGQVJ_TEST_ACCESS_TOKEN_DO_NOT_LEAK_abc123xyz";

function insightsUrl(query: string): string {
  return `http://localhost/api/instagram/insights?${query}`;
}

function authedRequest(url: string, bearer?: string): Request {
  const headers: Record<string, string> = {};
  if (bearer !== undefined) {
    headers.authorization = `Bearer ${bearer}`;
  }
  return new Request(url, { method: "GET", headers });
}

describe("parseMediaIdsParam", () => {
  it("rejects non-numeric ids", () => {
    const result = parseMediaIdsParam("123,abc");
    assert.ok(result && "error" in result);
    assert.match(result.error, /digits/i);
  });

  it("accepts up to 10 numeric ids", () => {
    const ids = Array.from({ length: 10 }, (_, i) => String(100 + i)).join(",");
    const result = parseMediaIdsParam(ids);
    assert.ok(Array.isArray(result));
    assert.equal(result.length, 10);
  });
});

describe("parseInsightsQuery account range", () => {
  it("requires account=1 with since/until within 30 days", () => {
    const ok = parseInsightsQuery(
      new URLSearchParams({
        account: "1",
        since: "2025-09-01",
        until: "2025-09-30",
      }),
    );
    assert.ok(!("error" in ok));
    assert.equal(ok.mode, "account");

    const tooLong = parseInsightsQuery(
      new URLSearchParams({
        account: "1",
        since: "2025-08-01",
        until: "2025-09-30",
      }),
    );
    assert.ok("error" in tooLong);
    assert.match(tooLong.error, /30 days/i);

    const badDate = parseInsightsQuery(
      new URLSearchParams({
        account: "1",
        since: "2025-13-01",
        until: "2025-09-02",
      }),
    );
    assert.ok("error" in badDate);
  });
});

describe("GET /api/instagram/insights auth and methods", () => {
  const priorSecret = process.env.IG_PUBLISH_SECRET;

  beforeEach(() => {
    process.env.IG_PUBLISH_SECRET = TEST_PUBLISH_SECRET;
  });

  afterEach(() => {
    if (priorSecret === undefined) delete process.env.IG_PUBLISH_SECRET;
    else process.env.IG_PUBLISH_SECRET = priorSecret;
  });

  it("returns 401 without bearer auth", () => {
    assert.equal(authorizeInstagramInsights(authedRequest(insightsUrl("recent=5"))), false);
  });

  it("returns 401 with wrong bearer", () => {
    assert.equal(
      authorizeInstagramInsights(authedRequest(insightsUrl("recent=5"), "wrong-secret")),
      false,
    );
  });

  it("does not accept portal session cookie without bearer", () => {
    const req = new Request(insightsUrl("recent=5"), {
      headers: { cookie: "bk_portal_session=forged-session-token" },
    });
    assert.equal(authorizeInstagramInsights(req), false);
  });

  it("returns 400 for invalid media ids", () => {
    const parsed = parseInsightsQuery(new URL(insightsUrl("media=12abc")).searchParams);
    assert.ok(parsed && "error" in parsed);
    assert.match(parsed.error, /digits/i);
  });

  it("returns 405 for POST", () => {
    assert.equal(INSIGHTS_METHOD_NOT_ALLOWED_STATUS, 405);
    assert.equal(insightsMethodNotAllowedBody().error, "Method not allowed");
  });
});

describe("executeInsightsQuery mocked Graph", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("omits rejected media metrics with notes and never echoes the access token", async () => {
    globalThis.fetch = async (input) => {
      const url = String(input);
      assert.ok(url.startsWith("https://graph.instagram.com/"), url);
      assert.ok(!url.includes(TEST_ACCESS_TOKEN) || url.includes("access_token="), url);

      if (url.includes("/17890000000000001?") || url.match(/\/17890000000000001\?/)) {
        return new Response(
          JSON.stringify({
            id: "17890000000000001",
            media_type: "IMAGE",
            permalink: "https://www.instagram.com/p/abc/",
            timestamp: "2025-09-01T12:00:00+0000",
            like_count: 3,
            comments_count: 1,
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }

      if (url.includes("/17890000000000001/insights")) {
        const metric = new URL(url).searchParams.get("metric");
        if (metric === "reach") {
          return new Response(
            JSON.stringify({
              data: [{ name: "reach", values: [{ value: 42 }] }],
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }
        return new Response(
          JSON.stringify({
            error: { message: `(#100) Metric ${metric} not available for this media` },
          }),
          { status: 400, headers: { "content-type": "application/json" } },
        );
      }

      return new Response(JSON.stringify({ error: { message: "unexpected url" } }), {
        status: 500,
      });
    };

    const result = await executeInsightsQuery(
      { mode: "media", ids: ["17890000000000001"], includeComments: false },
      { accessToken: TEST_ACCESS_TOKEN, igUserId: "17841400000000000" },
    );

    assert.equal(result.ok, true);
    assert.ok(result.media?.length === 1);
    const item = result.media![0]!;
    assert.equal(item.insights.reach, 42);
    assert.ok(item.insightNotes.length > 0);
    assert.ok(item.insightNotes.some((n) => n.metric === "views"));

    const serialized = JSON.stringify(result);
    assert.ok(!serialized.includes(TEST_ACCESS_TOKEN));
    assert.ok(!serialized.includes("IGQVJ"));
  });

  it("returns account daily rows and notes for partial metric failures", async () => {
    globalThis.fetch = async (input) => {
      const url = String(input);
      assert.ok(url.startsWith("https://graph.instagram.com/"));
      const metric = new URL(url).searchParams.get("metric");
      if (metric === "reach") {
        return new Response(
          JSON.stringify({
            data: [
              {
                name: "reach",
                values: [
                  { value: 10, end_time: "2025-09-02T07:00:00+0000" },
                  { value: 20, end_time: "2025-09-03T07:00:00+0000" },
                ],
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      if (metric === "profile_views") {
        return new Response(
          JSON.stringify({
            data: [
              {
                name: "profile_views",
                values: [{ value: 5, end_time: "2025-09-02T07:00:00+0000" }],
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ error: { message: `(#100) ${metric} unsupported` } }),
        { status: 400, headers: { "content-type": "application/json" } },
      );
    };

    const { daily, insightNotes } = await fetchAccountDailyInsights(
      "17841400000000000",
      TEST_ACCESS_TOKEN,
      "2025-09-01",
      "2025-09-03",
    );

    assert.ok(daily.some((d) => d.date === "2025-09-02" && d.reach === 10 && d.profile_views === 5));
    assert.ok(insightNotes.some((n) => n.metric === "website_clicks"));
    assert.ok(insightNotes.some((n) => n.metric === "profile_links_taps"));
  });
});
