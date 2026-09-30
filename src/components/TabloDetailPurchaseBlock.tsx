import { TabloDetailFinishFieldset } from "@/components/TabloDetailFinishFieldset";
import { FRAME_FINISHES, FRAME_FINISH_LABELS } from "@/lib/frame-finish";
import { tabloBuyExternal, tabloBuyLabel, tabloBuyUrl } from "@/lib/shop-buy";
import type { FrameFinish, Tablo } from "@/lib/types";

function finishNoteCopy(tablo: Tablo, finish: FrameFinish, external: boolean) {
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

/** SSR purchase UI: finish radios, buy CTA, and note toggled via CSS :has(). */
export function TabloDetailPurchaseBlock({
  tablo,
  initialFinish,
}: {
  tablo: Tablo;
  initialFinish: FrameFinish;
}) {
  const external = tabloBuyExternal(tablo);
  const externalAttrs = external ? { target: "_blank" as const, rel: "noopener noreferrer" } : {};

  return (
    <>
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
