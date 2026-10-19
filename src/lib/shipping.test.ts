import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SHOP_SHIPPING_EU_EUR,
  SHOP_SHIPPING_GERMANY_EUR,
  SHOP_SHIPPING_RATES,
  shopShippingLineLabel,
} from "./shipping";

describe("shop shipping rates", () => {
  it("fixes Germany and EU amounts", () => {
    assert.equal(SHOP_SHIPPING_GERMANY_EUR, 7.9);
    assert.equal(SHOP_SHIPPING_EU_EUR, 17.9);
    assert.deepEqual(SHOP_SHIPPING_RATES, { germanyEur: 7.9, euEur: 17.9 });
  });

  it("formats the public product-page line", () => {
    assert.equal(shopShippingLineLabel(), "Shipping: Germany €7.90 · EU €17.90");
  });
});
