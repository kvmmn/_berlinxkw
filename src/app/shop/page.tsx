import { ShopShell } from "@/components/ShopShell";
import { TabloJustifiedGallery } from "@/components/TabloJustifiedGallery";
import { TabloShopGridTile } from "@/components/TabloShopGridTile";
import { planTabloGalleryLayout } from "@/lib/tablo-gallery-layout";
import { COLLECTION_SHOP_EMPTY, COLLECTION_SHOP_INTRO } from "@/lib/site-brand";
import { prepareShopTablos } from "@/lib/tablo-shop-prepare";
import { tablosWithLayout } from "@/lib/tablo-shop-list";
import { withPublicTabloImages } from "@/lib/tablo-media";
import { tablosFromState } from "@/lib/tablo-store";
import { loadState } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const { state } = await loadState();
  const tablos = prepareShopTablos(
    withPublicTabloImages(
      [...tablosFromState(state)]
        .filter((t) => t.status === "listed")
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    ),
  );
  const layout = planTabloGalleryLayout(await tablosWithLayout(tablos));

  return (
    <ShopShell>
      <p className="bk-meta bk-shop-intro">{COLLECTION_SHOP_INTRO}</p>
      {layout.items.length === 0 ? (
        <p className="bk-shop-empty bk-meta">{COLLECTION_SHOP_EMPTY}</p>
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
