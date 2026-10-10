import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { prepareShopTablo } from "./tablo-shop-prepare";
import {
  tabloCatalogTitle,
  tabloDisplayTitleSlugs,
  tabloMetaDocumentTitle,
  tabloVisibleTitle,
} from "./tablo-title-display";
import type { Tablo } from "./types";

function stubTablo(overrides: Partial<Tablo> & Pick<Tablo, "slug" | "title">): Tablo {
  const now = "2026-01-01T00:00:00.000Z";
  const { slug, title, ...rest } = overrides;
  return {
    id: "tablo-test",
    createdAt: now,
    updatedAt: now,
    description: "",
    priceEur: 149,
    status: "listed",
    image: null,
    slug,
    title,
    ...rest,
  };
}

describe("tablo-title-display", () => {
  it("keeps slugs stable through shop prepare and display helpers", () => {
    for (const slug of tabloDisplayTitleSlugs()) {
      const tablo = stubTablo({
        slug,
        title: `Catalog name for ${slug}`,
      });
      const prepared = prepareShopTablo(tablo);
      assert.equal(prepared.slug, slug, `slug changed for ${slug}`);
      assert.equal(prepared.title, tablo.title, `stored title changed for ${slug}`);
      assert.equal(tabloVisibleTitle(prepared), tabloVisibleTitle(tablo));
    }
  });

  it("formats meta document title as display — catalog with Berlin in catalog name", () => {
    const clouds = stubTablo({
      slug: "berlin-clouds-01",
      title: "Berlin Clouds 01 — Contrail at Dusk",
    });
    assert.equal(
      tabloMetaDocumentTitle(clouds),
      "One Contrail at Dusk — Berlin Clouds 01 — Contrail at Dusk",
    );
    assert.equal(tabloVisibleTitle(clouds), "One Contrail at Dusk");
    assert.equal(tabloCatalogTitle(clouds), "Berlin Clouds 01 — Contrail at Dusk");

    const sunset2 = stubTablo({
      slug: "berlin-sunset-02",
      title: "Berlin Sunset 2",
    });
    assert.equal(tabloMetaDocumentTitle(sunset2), "Ten Minutes of Orange — Berlin Sunset 2");
  });

  it("falls back to catalog title when no display override", () => {
    const demo = stubTablo({
      slug: "mitte-glass-archive-i",
      title: "Mitte glass archive I",
    });
    assert.equal(tabloVisibleTitle(demo), "Mitte glass archive I");
    assert.equal(tabloMetaDocumentTitle(demo), "Mitte glass archive I");
  });
});
