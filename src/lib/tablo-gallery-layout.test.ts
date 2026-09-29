import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { planTabloGalleryLayout } from "./tablo-gallery-layout";
import type { TabloGalleryLayoutItem } from "./tablo-gallery-order";
import type { Tablo } from "./types";
import { chunkTabloGalleryRows, tabloAspectFlexGrow } from "./tablo-gallery-rows";

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
    productAspect: orientation === "landscape" ? "4 / 3" : "3 / 4",
    artworkAspect: "4 / 3",
    framedSlotAspect: "4 / 3",
  };
}

describe("planTabloGalleryLayout", () => {
  it("orders landscapes before portraits", () => {
    const plan = planTabloGalleryLayout([
      item("p", "portrait"),
      item("l1", "landscape"),
      item("l2", "landscape"),
    ]);
    assert.deepEqual(
      plan.items.map((x) => x.tablo.id),
      ["l1", "l2", "p"],
    );
  });
});

describe("tablo-gallery-rows", () => {
  it("chunks five tablos into rows of three and two", () => {
    const five = ["l1", "l2", "l3", "l4", "p"].map((id) =>
      item(id, id === "p" ? "portrait" : "landscape"),
    );
    assert.deepEqual(chunkTabloGalleryRows(five, 3).length, 2);
    assert.equal(chunkTabloGalleryRows(five, 3)[0]!.length, 3);
    assert.equal(chunkTabloGalleryRows(five, 3)[1]!.length, 2);
  });

  it("parses aspect flex grow as width/height", () => {
    assert.equal(tabloAspectFlexGrow("4 / 3"), 4 / 3);
    assert.equal(tabloAspectFlexGrow("3 / 4"), 0.75);
  });
});
