import { TabloDetailFinishFieldset } from "@/components/TabloDetailFinishFieldset";
import { TabloDetailSizeFieldset } from "@/components/TabloDetailSizeFieldset";
import { FRAME_FINISHES, FRAME_FINISH_LABELS } from "@/lib/frame-finish";
import { tabloBuyExternal, tabloBuyLabel, tabloBuyUrl } from "@/lib/shop-buy";
import type { TabloShopSizeId } from "@/lib/types";
import type { TabloOrientation } from "@/lib/tablo-frame-spec";
import type { FrameFinish, ShopTablo } from "@/lib/types";

function finishNoteCopy(tablo: ShopTablo, finish: FrameFinish, external: boolean) {
  const label = FRAME_FINISH_LABELS[finish];
  if (external) {
    return <>If the shop link omits finish, choose {label.en} at checkout.</>;
  }
  if (tablo.marketplaceUrl?.trim()) {
    return <>Finish is in the link when supported — else note {label.en}.</>;
  }
  return (
    <>
      DM @berlinxkw — finish: {label.en} (
      <span className="bk-text-fa" lang="fa">
        {label.fa}
      </span>
      ).
    </>
  );
}

/** SSR purchase UI: size + finish radios, buy CTA, and note toggled via CSS :has(). */
export function TabloDetailPurchaseBlock({
  tablo,
  orientation,
  initialFinish,
  initialSize,
}: {
  tablo: ShopTablo;
  orientation: TabloOrientation;
  initialFinish: FrameFinish;
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
      <TabloDetailFinishFieldset initialFinish={initialFinish} />
      <div className="bk-tablo-detail-cta">
        {FRAME_FINISHES.map((finish) => (
          <a
            key={finish}
            href={tabloBuyUrl(tablo, finish)}
            className={`bk-btn bk-btn-primary bk-tablo-buy-lg bk-tablo-detail-buy-btn-finish bk-tablo-detail-buy-btn-finish-${finish}`}
            {...externalAttrs}
          >
            {tabloBuyLabel(tablo)}
          </a>
        ))}
        {FRAME_FINISHES.map((finish) => (
          <p
            key={finish}
            className={`bk-tablo-buy-note bk-tablo-detail-buy-note-finish bk-tablo-detail-buy-note-finish-${finish}`}
          >
            {finishNoteCopy(tablo, finish, external)}
          </p>
        ))}
      </div>
    </>
  );
}
