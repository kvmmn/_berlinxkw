import { ShopShell } from "@/components/ShopShell";
import { TabloCard } from "@/components/TabloCard";
import { planTabloGalleryLayout } from "@/lib/tablo-gallery-layout";
import { tablosWithLayout } from "@/lib/tablo-shop-list";
import { withPublicTabloImages } from "@/lib/tablo-media";
import { tablosFromState } from "@/lib/tablo-store";
import { loadState } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const { state } = await loadState();
  const tablos = withPublicTabloImages(
    [...tablosFromState(state)]
      .filter((t) => t.status === "listed")
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
  );
  const layout = planTabloGalleryLayout(await tablosWithLayout(tablos));

  return (
    <ShopShell>
      <p className="bk-meta bk-shop-intro">original tablos · listed works</p>
      {layout.items.length === 0 ? (
        <p className="bk-shop-empty bk-meta">No listed tablos yet — check back soon.</p>
      ) : (
        <ul
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
        </ul>
      )}
    </ShopShell>
  );
}
