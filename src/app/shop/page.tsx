import { ShopShell } from "@/components/ShopShell";
import { TabloJustifiedGallery } from "@/components/TabloJustifiedGallery";
import { TabloShopGridTile } from "@/components/TabloShopGridTile";
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
        <TabloJustifiedGallery
          items={layout.items}
          renderTile={(item) => (
            <TabloShopGridTile tablo={item.tablo} orientation={item.orientation} />
          )}
        />
      )}
    </ShopShell>
  );
}
