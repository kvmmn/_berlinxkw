"use client";

import Link from "next/link";
import { TabloImprovisationSubtitle } from "@/components/TabloImprovisationSubtitle";
import { TabloCardMedia } from "@/components/TabloShopMedia";
import { tabloDefaultFrameFinish } from "@/lib/frame-finish";
import { tabloArtworkImage, tabloProductImage } from "@/lib/tablo-images";
import { useTabloImageAspect } from "@/lib/tablo-image-aspect-client";
import { useTabloOrientation } from "@/lib/tablo-orientation-client";
import { frameSizeLabel, type TabloOrientation } from "@/lib/tablo-frame-spec";
import { tabloBuyExternal, tabloBuyLabel, tabloBuyUrl } from "@/lib/shop-buy";
import { tabloTitleWithBoundEmDash, tabloVisibleTitle } from "@/lib/tablo-title-display";
import type { Tablo } from "@/lib/types";

function formatEur(price: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
}

export function TabloCard({
  tablo,
  orientation: initialOrientation = "portrait",
  productAspect: initialProductAspect,
}: {
  tablo: Tablo;
  orientation?: TabloOrientation;
  productAspect: string;
}) {
  const orientation = useTabloOrientation(initialOrientation, tabloArtworkImage(tablo)?.url, {
    trustServer: true,
  });
  const product = tabloProductImage(tablo);
  const productAspect = useTabloImageAspect(initialProductAspect, product?.url, {
    trustServer: true,
  });
  const buyHref = tabloBuyUrl(tablo, tabloDefaultFrameFinish(tablo));
  const external = tabloBuyExternal(tablo);

  return (
    <article className="bk-tablo-tile">
      <Link
        href={`/shop/${tablo.slug}`}
        className="bk-tablo-tile-media-link"
        aria-label={`View ${tabloVisibleTitle(tablo)}`}
      >
        <TabloCardMedia tablo={tablo} aspectRatio={productAspect} />
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
        {tablo.status === "sold" ? (
          <span className="bk-meta bk-tablo-sold">sold</span>
        ) : (
          <a
            href={buyHref}
            className="bk-btn bk-btn-primary bk-tablo-buy"
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {tabloBuyLabel(tablo)}
          </a>
        )}
      </div>
    </article>
  );
}
