import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isPortalBlobProxyPathname } from "./portal-blob-paths";

describe("portal blob proxy allowlist", () => {
  it("allows ideas and tablos media", () => {
    assert.equal(isPortalBlobProxyPathname("berlinxkw/ideas/x/photo.jpg"), true);
    assert.equal(isPortalBlobProxyPathname("berlinxkw/tablos/id/framed/x.jpg"), true);
  });

  it("blocks store, system, and other prefixes", () => {
    assert.equal(isPortalBlobProxyPathname("berlinxkw/store.json"), false);
    assert.equal(isPortalBlobProxyPathname("berlinxkw/system/instagram-token.json"), false);
    assert.equal(isPortalBlobProxyPathname("berlinxkw/langgraph-checkpoints.json"), false);
    assert.equal(isPortalBlobProxyPathname("berlinxkw/instagram/demo/x.jpg"), false);
  });
});
