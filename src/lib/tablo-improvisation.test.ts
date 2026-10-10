import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyTabloImprovisationFields,
  tabloImprovisationLabel,
} from "./tablo-improvisation";
import type { Tablo } from "./types";

function stubTablo(overrides: Partial<Tablo> & Pick<Tablo, "slug">): Tablo {
  const now = "2026-01-01T00:00:00.000Z";
  const { slug, ...rest } = overrides;
  return {
    id: "tablo-test",
    createdAt: now,
    updatedAt: now,
    title: "Test",
    description: "",
    priceEur: 100,
    status: "listed",
    image: null,
    slug,
    ...rest,
  };
}

describe("tablo-improvisation", () => {
  it("applies canonical fields for Berlin listed slugs", () => {
    const clouds = applyTabloImprovisationFields(stubTablo({ slug: "berlin-clouds-01" }));
    assert.equal(clouds.improvisationNo, 1);
    assert.equal(clouds.improvisationLine, "one contrail at dusk");
    assert.equal(
      tabloImprovisationLabel(clouds),
      "Improvisation No. 01 — one contrail at dusk",
    );

    const sunset2 = applyTabloImprovisationFields(stubTablo({ slug: "berlin-sunset-02" }));
    assert.equal(
      tabloImprovisationLabel(sunset2),
      "Improvisation No. 02 — ten minutes of orange",
    );

    const sunset3 = applyTabloImprovisationFields(stubTablo({ slug: "berlin-sunset-03" }));
    assert.equal(tabloImprovisationLabel(sunset3), "Improvisation No. 03 — Berlin goes gold");
  });

  it("leaves unrelated tablos without improvisation", () => {
    const demo = stubTablo({ slug: "mitte-glass-archive-i" });
    assert.equal(applyTabloImprovisationFields(demo).improvisationNo, undefined);
    assert.equal(tabloImprovisationLabel(demo), null);
  });

  it("prefers persisted values over canonical defaults", () => {
    const tablo = stubTablo({
      slug: "berlin-clouds-01",
      improvisationNo: 9,
      improvisationLine: "custom line",
    });
    assert.equal(tabloImprovisationLabel(tablo), "Improvisation No. 09 — custom line");
  });
});
