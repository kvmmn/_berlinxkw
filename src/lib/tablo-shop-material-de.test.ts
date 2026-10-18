import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { tabloSizeMaterialLineDe } from "./tablo-shop-material-de";

describe("tabloSizeMaterialLineDe", () => {
  it("formats large portrait and mini landscape", () => {
    assert.equal(
      tabloSizeMaterialLineDe("large", "portrait"),
      "Messingrahmen, mit Passepartout, 50×70 cm",
    );
    assert.equal(
      tabloSizeMaterialLineDe("mini", "landscape"),
      "Messingrahmen, ohne Passepartout, 40×30 cm",
    );
  });
});
