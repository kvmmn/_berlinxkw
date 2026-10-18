import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  TABLO_SHOP_SIZE_LARGE,
  TABLO_SHOP_SIZE_MINI,
  formatShopPriceEur,
  shopGridPriceLabel,
  tabloSizeDimensionsForOrientation,
  tabloSizeFrameLabel,
  tabloShopSizesForApi,
} from "./tablo-sizes";

describe("tablo shop sizes", () => {
  it("fixes large and mini prices in code", () => {
    assert.equal(TABLO_SHOP_SIZE_LARGE.priceEur, 99);
    assert.equal(TABLO_SHOP_SIZE_MINI.priceEur, 69);
    assert.equal(TABLO_SHOP_SIZE_LARGE.mat, true);
    assert.equal(TABLO_SHOP_SIZE_MINI.mat, false);
  });

  it("maps catalog dimensions per orientation", () => {
    assert.equal(tabloSizeFrameLabel("large", "landscape"), "70×50 cm");
    assert.equal(tabloSizeFrameLabel("large", "portrait"), "50×70 cm");
    assert.equal(tabloSizeFrameLabel("mini", "landscape"), "40×30 cm");
    assert.equal(tabloSizeFrameLabel("mini", "portrait"), "30×40 cm");
    assert.equal(tabloSizeDimensionsForOrientation("mini", "landscape").aspectRatio, "40 / 30");
  });

  it("formats grid from-price label", () => {
    assert.equal(formatShopPriceEur(69), "69\u00a0€");
    assert.equal(shopGridPriceLabel(), "from 69\u00a0€");
  });

  it("exports API size payloads from constants", () => {
    const sizes = tabloShopSizesForApi(["large", "mini"]);
    assert.equal(sizes.length, 2);
    assert.deepEqual(sizes[0], {
      id: "large",
      label: "Large",
      dimensions: { shortCm: 50, longCm: 70 },
      mat: true,
      priceEur: 99,
    });
    assert.deepEqual(sizes[1], {
      id: "mini",
      label: "Mini",
      dimensions: { shortCm: 30, longCm: 40 },
      mat: false,
      priceEur: 69,
    });
  });
});
