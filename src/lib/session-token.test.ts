import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  createSessionToken,
  resetSessionSigningKeyCacheForTests,
  verifySessionToken,
} from "./session-token";

const TEST_SECRET = "test-blob-token-for-unit-tests-only";

describe("portal session token", () => {
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

  it("rejects missing cookie", async () => {
    assert.equal(await verifySessionToken(undefined), false);
    assert.equal(await verifySessionToken(""), false);
  });

  it("rejects forged legacy cookie", async () => {
    assert.equal(await verifySessionToken("x"), false);
    assert.equal(await verifySessionToken("bk_abc123"), false);
  });

  it("rejects tampered signature", async () => {
    const token = await createSessionToken(1_700_000_000);
    assert.ok(token);
    const parts = token!.split(".");
    const forged = `${parts[0]}.${parts[1]}.${parts[2]!.slice(0, -1)}A`;
    assert.equal(await verifySessionToken(forged, 1_700_000_000), false);
  });

  it("rejects expired token", async () => {
    const now = 1_700_000_000;
    const token = await createSessionToken(now);
    assert.ok(token);
    const expiredAt = now + 60 * 60 * 24 * 14 + 1;
    assert.equal(await verifySessionToken(token, expiredAt), false);
  });

  it("accepts valid token within TTL", async () => {
    const now = 1_700_000_000;
    const token = await createSessionToken(now);
    assert.ok(token);
    assert.equal(await verifySessionToken(token, now), true);
    assert.equal(await verifySessionToken(token, now + 3600), true);
  });

  it("fails closed when signing material is unset", async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    resetSessionSigningKeyCacheForTests();
    assert.equal(await createSessionToken(), null);
    assert.equal(await verifySessionToken("v1.e30.sig"), false);
  });
});
