import Link from "next/link";
import { TabloImprovisationSubtitle } from "@/components/TabloImprovisationSubtitle";
import { TabloCardMedia } from "@/components/TabloShopMedia";
import {
  frameGridStageAspect,
  frameSizeLabel,
  type TabloOrientation,
} from "@/lib/tablo-frame-spec";
import { tabloBuyExternal, tabloBuyLabel, tabloBuyUrl } from "@/lib/shop-buy";
import { tabloDefaultFrameFinish } from "@/lib/frame-finish";
import { tabloTitleWithBoundEmDash, tabloVisibleTitle } from "@/lib/tablo-title-display";
import type { Tablo } from "@/lib/types";

function formatEur(price: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
}

/** SSR gallery / shop grid tile — no client probes (stable hydration). */
export function TabloShopGridTile({
  tablo,
  orientation,
  showBuy = true,
  priority = false,
}: {
  tablo: Tablo;
  orientation: TabloOrientation;
  showBuy?: boolean;
  priority?: boolean;
}) {
  const stageAspect = frameGridStageAspect(orientation);
  const buyHref = tabloBuyUrl(tablo, tabloDefaultFrameFinish(tablo));
  const external = tabloBuyExternal(tablo);

  return (
    <article className="bk-tablo-tile">
      <Link
        href={`/shop/${tablo.slug}`}
        className="bk-tablo-tile-media-link"
        aria-label={`View ${tabloVisibleTitle(tablo)}`}
      >
        <TabloCardMedia
          tablo={tablo}
          aspectRatio={stageAspect}
          fit="contain"
          priority={priority}
          gridOrientation={orientation}
          className="bk-tablo-tile-media--frame-stage"
        />
      </Link>
      <div className="bk-tablo-tile-caption">
        <Link href={`/shop/${tablo.slug}`}>
          <h2 className="bk-tablo-tile-title">
            {tabloTitleWithBoundEmDash(tabloVisibleTitle(tablo))}
          </h2>
        </Link>
        <TabloImprovisationSubtitle tablo={tablo} />
        <p className="bk-meta bk-tablo-tile-meta">
          <span className="bk-tablo-tile-price">{formatEur(tablo.priceEur)}</span>
          <span aria-hidden="true"> · </span>
          <span>{frameSizeLabel(orientation)}</span>
        </p>
        {showBuy &&
          (tablo.status === "sold" ? (
            <span className="bk-meta bk-tablo-sold">sold</span>
          ) : (
            <a
              href={buyHref}
              className="bk-btn bk-btn-primary bk-tablo-buy"
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {tabloBuyLabel(tablo)}
            </a>
          ))}
      </div>
    </article>
  );
}
