import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { orderTablosForGalleryGrid, type TabloGalleryLayoutItem } from "./tablo-gallery-order";
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

describe("orderTablosForGalleryGrid", () => {
  it("places all landscapes before portraits, preserving order within each group", () => {
    const input = [item("p1", "portrait"), item("l1", "landscape"), item("l2", "landscape"), item("p2", "portrait")];
    const out = orderTablosForGalleryGrid(input);
    assert.deepEqual(
      out.map((x) => x.tablo.id),
      ["l1", "l2", "p1", "p2"],
    );
  });
});
