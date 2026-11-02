import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { prepareShopTablo } from "./tablo-shop-prepare";
import { SHOP_PUBLIC_FRAME_FINISH } from "./shop-public-frame-finish";
import { TABLO_SHOP_MIN_PRICE_EUR } from "./tablo-sizes";
import type { Tablo } from "./types";

function stubTablo(overrides: Partial<Tablo> = {}): Tablo {
  return {
    id: "t1",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    title: "Berlin Sunsets",
    slug: "berlin-sunset-02",
    description: "",
    priceEur: 149,
    status: "listed",
    image: null,
    frameFinishes: ["bronze", "matte-black-brushed", "matte-steel-brushed"],
    defaultFrameFinish: "matte-black-brushed",
    ...overrides,
  };
}

describe("prepareShopTablo for public /api/shop", () => {
  it("overrides legacy blob price with catalog from-price", () => {
    const prepared = prepareShopTablo(stubTablo({ priceEur: 149 }));
    assert.equal(prepared.priceEur, TABLO_SHOP_MIN_PRICE_EUR);
    assert.equal(prepared.priceEur, 59);
  });

  it("exposes brass-only frame finishes on the public payload", () => {
    const prepared = prepareShopTablo(stubTablo());
    assert.deepEqual(prepared.frameFinishes, [SHOP_PUBLIC_FRAME_FINISH]);
    assert.equal(prepared.defaultFrameFinish, SHOP_PUBLIC_FRAME_FINISH);
  });

  it("keeps derived sizes from code constants", () => {
    const prepared = prepareShopTablo(stubTablo());
    assert.equal(prepared.sizes.length, 2);
    assert.equal(prepared.sizes[0]?.priceEur, 89);
    assert.equal(prepared.sizes[1]?.priceEur, 59);
  });

  it("sanitizes stored descriptions for public consumers", () => {
    const raw =
      "Berlin Sunsets · غروب‌های برلین · berlin × kawe. Original photo · 30×45 cm fine-art print · handmade 50×70 cm metal frame with wide mat · brass, matte black or brushed steel · €149 · Free shipping in Germany · Neon study on glass.";
    const prepared = prepareShopTablo(stubTablo({ description: raw }));
    assert.equal(prepared.description, "Berlin Sunsets · berlin × kawe.");
  });
});
