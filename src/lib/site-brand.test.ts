import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  COLLECTION_DETAIL_EYEBROW,
  COLLECTION_HOME_SECTION,
  COLLECTION_SHOP_INTRO,
  SITE_HERO_HEADLINE,
} from "./site-brand";

describe("site-brand", () => {
  it("keeps Improvisations in Berlin as the brand hero line only", () => {
    assert.equal(SITE_HERO_HEADLINE, "Improvisations in Berlin");
  });

  it("does not use Improvisations as a per-photo or collection naming scheme", () => {
    for (const label of [COLLECTION_SHOP_INTRO, COLLECTION_HOME_SECTION, COLLECTION_DETAIL_EYEBROW]) {
      assert.ok(!label.includes("Improvisation No."), label);
      assert.ok(!/^Improvisations\b/.test(label), label);
    }
    assert.equal(COLLECTION_SHOP_INTRO, "Framed prints");
  });
});
