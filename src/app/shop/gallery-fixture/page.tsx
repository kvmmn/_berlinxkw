import { ShopShell } from "@/components/ShopShell";
import { TabloJustifiedGallery } from "@/components/TabloJustifiedGallery";
import { TabloShopGridTile } from "@/components/TabloShopGridTile";
import type { TabloGalleryLayoutItem } from "@/lib/tablo-gallery-order";
import type { Tablo } from "@/lib/types";

export const dynamic = "force-dynamic";

const PLACEHOLDER_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'/%3E";

function stubTablo(id: string, title: string, orientation: "landscape" | "portrait"): Tablo {
  return {
    id,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    title,
    slug: id,
    description: "",
    priceEur: 420,
    status: "listed",
    image: { url: PLACEHOLDER_SVG, mime: "image/svg+xml", pathname: id },
    captionDraft: "",
    framedImage: null,
  };
}

function layoutItem(id: string, title: string, orientation: "landscape" | "portrait"): TabloGalleryLayoutItem {
  return {
    tablo: stubTablo(id, title, orientation),
    orientation,
    productAspect: orientation === "landscape" ? "4 / 3" : "3 / 4",
    artworkAspect: "4 / 3",
    framedSlotAspect: "4 / 3",
  };
}

/** Measurement page: real shop tiles + row packing (portrait always last). */
export default function GalleryFixturePage() {
  const four: TabloGalleryLayoutItem[] = [
    layoutItem("l1", "Berlin clouds 01", "landscape"),
    layoutItem("l2", "Berlin clouds 02", "landscape"),
    layoutItem("l3", "Berlin clouds 03", "landscape"),
    layoutItem("p", "Berlin sunset 03", "portrait"),
  ];
  const five: TabloGalleryLayoutItem[] = [
    ...four.slice(0, 3),
    layoutItem("l4", "Berlin clouds 04", "landscape"),
    four[3]!,
  ];

  return (
    <ShopShell>
      <p className="bk-meta bk-shop-intro">gallery row fixture · not listed inventory</p>
      <section aria-labelledby="fixture-four">
        <h2 id="fixture-four" className="bk-meta">
          four tablos
        </h2>
        <TabloJustifiedGallery
          items={four}
          renderTile={(item) => (
            <TabloShopGridTile
              tablo={item.tablo}
              orientation={item.orientation}
              productAspect={item.productAspect}
            />
          )}
        />
      </section>
      <section aria-labelledby="fixture-five" style={{ marginTop: "3rem" }}>
        <h2 id="fixture-five" className="bk-meta">
          five tablos
        </h2>
        <TabloJustifiedGallery
          items={five}
          renderTile={(item) => (
            <TabloShopGridTile
              tablo={item.tablo}
              orientation={item.orientation}
              productAspect={item.productAspect}
            />
          )}
        />
      </section>
    </ShopShell>
  );
}
