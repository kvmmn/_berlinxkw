import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { tabloShopBuyUrl } from "./shop-buy";
import type { Tablo } from "./types";

function stubTablo(overrides: Partial<Tablo> = {}): Tablo {
  return {
    id: "t1",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    title: "Test",
    slug: "test",
    description: "",
    priceEur: 149,
    status: "listed",
    image: null,
    ...overrides,
  };
}

describe("tabloShopBuyUrl", () => {
  it("always appends brass (bronze) finish for DM fallback links", () => {
    const href = tabloShopBuyUrl(stubTablo());
    assert.match(href, /frameFinish=bronze/);
    assert.doesNotMatch(href, /matte-black-brushed|matte-steel-brushed/);
  });

  it("never exposes non-brass finishes on marketplace links", () => {
    const href = tabloShopBuyUrl(
      stubTablo({ marketplaceUrl: "https://example.com/buy?ref=1" }),
    );
    assert.match(href, /frameFinish=bronze/);
  });
});
