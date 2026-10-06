import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { NextRequest } from "next/server";
import { AUTH_COOKIE, resetSessionSigningKeyCacheForTests } from "@/lib/session-token";
import { isPublicStaticAssetPath, middleware } from "./middleware";

const TEST_SECRET = "test-blob-token-for-middleware-unit-tests";

function req(pathname: string, cookie?: string): NextRequest {
  const url = new URL(pathname, "http://localhost");
  if (cookie === undefined) {
    return new NextRequest(url);
  }
  return new NextRequest(url, {
    headers: { cookie: `${AUTH_COOKIE}=${cookie}` },
  });
}

describe("isPublicStaticAssetPath", () => {
  it("allows public ig assets", () => {
    assert.equal(isPublicStaticAssetPath("/ig/sunset-02/1-brass.jpg"), true);
    assert.equal(isPublicStaticAssetPath("/ig/third/1-hook.jpg"), true);
  });

  it("denies api paths even with image extensions", () => {
    assert.equal(isPublicStaticAssetPath("/api/sessions/x.png"), false);
    assert.equal(isPublicStaticAssetPath("/api/ideas/x.jpg"), false);
    assert.equal(isPublicStaticAssetPath("/api/tablos/x.svg"), false);
    assert.equal(isPublicStaticAssetPath("/api/decisions/x.png"), false);
  });

  it("denies portal paths with static extensions", () => {
    assert.equal(isPublicStaticAssetPath("/portal/foo.png"), false);
  });
});

describe("middleware auth", () => {
  beforeEach(() => {
    resetSessionSigningKeyCacheForTests();
    process.env.BLOB_READ_WRITE_TOKEN = TEST_SECRET;
    delete process.env.PORTAL_SESSION_SECRET;
  });

  afterEach(() => {
    resetSessionSigningKeyCacheForTests();
    delete process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.PORTAL_SESSION_SECRET;
  });

  it("returns 401 for spoofed static api paths without session", async () => {
    const res = await middleware(req("/api/sessions/session-abc.png"));
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error, "Unauthorized");

    const ideas = await middleware(req("/api/ideas/idea-abc.jpg"));
    assert.equal(ideas.status, 401);
  });

  it("returns 401 for forged legacy cookie on static-suffixed protected api path", async () => {
    const res = await middleware(req("/api/state.png", "bk_abc123"));
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error, "Unauthorized");
  });

  it("passes public ig static assets without session", async () => {
    const res = await middleware(req("/ig/sunset-02/1-brass.jpg"));
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("x-middleware-next"), "1");
  });

  it("passes public shop api without session", async () => {
    const res = await middleware(req("/api/shop"));
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("x-middleware-next"), "1");
  });

  it("passes instagram publish without portal cookie (handler bearer auth)", async () => {
    const res = await middleware(req("/api/instagram/publish"));
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("x-middleware-next"), "1");
  });
});
