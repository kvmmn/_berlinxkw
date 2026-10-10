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
  it("applies canonical numbers for Berlin listed slugs", () => {
    assert.equal(tabloImprovisationLabel(stubTablo({ slug: "berlin-clouds-01" })), "Improvisation No. 01");
    assert.equal(tabloImprovisationLabel(stubTablo({ slug: "berlin-sunset-02" })), "Improvisation No. 02");
    assert.equal(tabloImprovisationLabel(stubTablo({ slug: "berlin-sunset-03" })), "Improvisation No. 03");
  });

  it("leaves unrelated tablos without improvisation", () => {
    const demo = stubTablo({ slug: "mitte-glass-archive-i" });
    assert.equal(applyTabloImprovisationFields(demo).improvisationNo, undefined);
    assert.equal(tabloImprovisationLabel(demo), null);
  });

  it("prefers persisted improvisationNo over canonical defaults", () => {
    const tablo = stubTablo({ slug: "berlin-clouds-01", improvisationNo: 9 });
    assert.equal(tabloImprovisationLabel(tablo), "Improvisation No. 09");
  });
});
