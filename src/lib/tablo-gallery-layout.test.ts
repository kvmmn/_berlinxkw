import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { planTabloGalleryLayout } from "./tablo-gallery-layout";
import type { TabloGalleryLayoutItem } from "./tablo-gallery-order";
import type { Tablo } from "./types";

function stubTablo(id: string): Tablo {
  return {
    id,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    title: id,
    slug: id,
    description: "",
    priceEur: 100,
    status: "listed",
    image: null,
    captionDraft: "",
    framedImage: null,
  };
}

function item(id: string, orientation: "landscape" | "portrait"): TabloGalleryLayoutItem {
  return {
    tablo: stubTablo(id),
    orientation,
    productAspect: "4 / 3",
    artworkAspect: "4 / 3",
    framedSlotAspect: "4 / 3",
  };
}

describe("planTabloGalleryLayout", () => {
  it("uses portrait-rail order L,L,P for one portrait and two landscapes", () => {
    const plan = planTabloGalleryLayout([item("p", "portrait"), item("l1", "landscape"), item("l2", "landscape")]);
    assert.equal(plan.mode, "portrait-rail");
    assert.deepEqual(
      plan.items.map((x) => x.tablo.id),
      ["l1", "l2", "p"],
    );
  });

  it("uses default order when two portraits", () => {
    const plan = planTabloGalleryLayout([item("p1", "portrait"), item("p2", "portrait"), item("l1", "landscape")]);
    assert.equal(plan.mode, "default");
  });
});
