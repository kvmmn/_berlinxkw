import { ShopShell } from "@/components/ShopShell";
import { TabloGalleryGrid } from "@/components/TabloGalleryGrid";
import { TabloCard } from "@/components/TabloCard";
import { planTabloGalleryLayout } from "@/lib/tablo-gallery-layout";
import { tablosWithLayout } from "@/lib/tablo-shop-list";
import type { TabloGalleryLayoutItem } from "@/lib/tablo-gallery-order";
import { withPublicTabloImages } from "@/lib/tablo-media";
import { tablosFromState } from "@/lib/tablo-store";
import { loadState } from "@/lib/storage";

export const dynamic = "force-dynamic";

function layoutItemsForGallerySim5(items: TabloGalleryLayoutItem[]): TabloGalleryLayoutItem[] {
  if (items.length < 3) return items;
  const portrait = items.find((i) => i.orientation === "portrait");
  const landscapes = items.filter((i) => i.orientation !== "portrait");
  if (!portrait || landscapes.length === 0) return items;
  const rail: TabloGalleryLayoutItem[] = [...landscapes.slice(0, 2)];
  while (rail.length < 4) {
    const src = landscapes[rail.length % landscapes.length] ?? landscapes[0]!;
    rail.push({
      ...src,
      tablo: {
        ...src.tablo,
        id: `${src.tablo.id}-sim${rail.length}`,
        slug: `${src.tablo.slug}-sim${rail.length}`,
        title: `${src.tablo.title} (sim ${rail.length})`,
      },
    });
  }
  return [...rail, portrait];
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ gallerySim5?: string }>;
}) {
  const sp = await searchParams;
  const { state } = await loadState();
  const tablos = withPublicTabloImages(
    [...tablosFromState(state)]
      .filter((t) => t.status === "listed")
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
  );
  let layoutItems = await tablosWithLayout(tablos);
  if (sp.gallerySim5 === "1") {
    layoutItems = layoutItemsForGallerySim5(layoutItems);
  }
  const layout = planTabloGalleryLayout(layoutItems);

  return (
    <ShopShell>
      <p className="bk-meta bk-shop-intro">original tablos · listed works</p>
      {layout.items.length === 0 ? (
        <p className="bk-shop-empty bk-meta">No listed tablos yet — check back soon.</p>
      ) : (
        <TabloGalleryGrid
          mode={layout.mode}
          railLandscapeAspect={layout.railLandscapeAspect}
          className={
            layout.mode === "portrait-rail"
              ? "bk-tablo-grid bk-tablo-grid--portrait-rail"
              : "bk-tablo-grid"
          }
        >
          {layout.items.map(({ tablo, orientation, productAspect }) => (
            <li
              key={tablo.id}
              className={
                tablo.id === layout.portraitTabloId ? "bk-tablo-grid-portrait-span" : undefined
              }
            >
              <TabloCard tablo={tablo} orientation={orientation} productAspect={productAspect} />
            </li>
          ))}
        </TabloGalleryGrid>
      )}
    </ShopShell>
  );
}
