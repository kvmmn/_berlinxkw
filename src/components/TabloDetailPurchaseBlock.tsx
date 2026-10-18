import { RunEn, RunFa } from "@/components/BidiRun";
import { TabloDetailSizeFieldset } from "@/components/TabloDetailSizeFieldset";
import { tabloBuyExternal, tabloBuyLabel, tabloShopBuyUrl } from "@/lib/shop-buy";
import { tabloShopSizeById } from "@/lib/tablo-sizes";
import { tabloVisibleTitle } from "@/lib/tablo-title-display";
import type { TabloShopSizeId } from "@/lib/types";
import type { TabloOrientation } from "@/lib/tablo-frame-spec";
import type { ShopTablo } from "@/lib/types";

function purchaseNoteCopy(tablo: ShopTablo, sizeId: TabloShopSizeId, external: boolean) {
  const size = tabloShopSizeById(sizeId);
  const title = tabloVisibleTitle(tablo);
  if (external) {
    return (
      <RunEn>
        Brass frame only — choose {size.label} at checkout if size options appear.
      </RunEn>
    );
  }
  if (tablo.marketplaceUrl?.trim()) {
    return (
      <RunEn>
        Size is in the link when supported — else note {size.label} ({title}).
      </RunEn>
    );
  }
  return (
    <>
      <RunEn>
        DM @berlinxkw — {title}, {size.label}
      </RunEn>
      <RunFa className="bk-tablo-detail-buy-note-fa">{size.labelFa}</RunFa>
    </>
  );
}

/** SSR purchase UI: size radios, buy CTA, and DM note toggled via CSS :has() on size. */
export function TabloDetailPurchaseBlock({
  tablo,
  orientation,
  initialSize,
}: {
  tablo: ShopTablo;
  orientation: TabloOrientation;
  initialSize: TabloShopSizeId;
}) {
  const external = tabloBuyExternal(tablo);
  const externalAttrs = external ? { target: "_blank" as const, rel: "noopener noreferrer" } : {};
  const sizeIds = tablo.sizes.map((s) => s.id);

  return (
    <>
      <TabloDetailSizeFieldset
        sizeIds={sizeIds}
        orientation={orientation}
        initialSize={initialSize}
      />
      <div className="bk-tablo-detail-cta">
        <a
          href={tabloShopBuyUrl(tablo)}
          className="bk-btn bk-btn-primary bk-tablo-buy-lg bk-tablo-detail-buy-btn"
          {...externalAttrs}
        >
          {tabloBuyLabel(tablo)}
        </a>
        {sizeIds.map((sizeId) => (
          <p
            key={sizeId}
            className={`bk-tablo-buy-note bk-tablo-detail-buy-note-size bk-tablo-detail-buy-note-size-${sizeId}`}
          >
            {purchaseNoteCopy(tablo, sizeId, external)}
          </p>
        ))}
      </div>
    </>
  );
}
