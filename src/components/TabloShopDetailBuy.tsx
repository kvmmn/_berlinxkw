"use client";

import { useMemo, useState } from "react";
import { TabloDetailGallery } from "@/components/TabloShopMedia";
import { TabloFrameFinishPicker } from "@/components/TabloFrameFinishPicker";
import { coerceFrameFinish } from "@/lib/frame-finish";
import { tabloArtworkImage } from "@/lib/tablo-images";
import { useTabloImageAspect } from "@/lib/tablo-image-aspect-client";
import { useTabloOrientation } from "@/lib/tablo-orientation-client";
import { frameSizeLabel, orientationCopy, type TabloOrientation } from "@/lib/tablo-frame-spec";
import { tabloTitleWithBoundEmDash } from "@/lib/tablo-title-display";
import { TabloBuyFinishNote } from "@/components/TabloBuyFinishNote";
import { TabloDescription } from "@/components/TabloDescription";
import { tabloBuyExternal, tabloBuyLabel, tabloBuyUrl } from "@/lib/shop-buy";
import type { FrameFinish, Tablo } from "@/lib/types";

export function TabloShopDetailBuy({
  tablo,
  priceLabel,
  orientation: initialOrientation,
  framedSlotAspect: initialFramedAspect,
  artworkAspect: initialArtworkAspect,
}: {
  tablo: Tablo;
  priceLabel: string;
  orientation: TabloOrientation;
  framedSlotAspect: string;
  artworkAspect: string;
}) {
  const [finish, setFinish] = useState<FrameFinish>(() => coerceFrameFinish(tablo, undefined));
  const orientation = useTabloOrientation(initialOrientation, tabloArtworkImage(tablo)?.url);
  const framedSlotAspect = initialFramedAspect;
  const artworkAspect = useTabloImageAspect(initialArtworkAspect, tabloArtworkImage(tablo)?.url);
  const buyHref = useMemo(() => tabloBuyUrl(tablo, finish), [tablo, finish]);
  const external = tabloBuyExternal(tablo);
  const dir = orientationCopy(orientation);

  return (
    <>
      <div className="bk-tablo-detail-media">
        <TabloDetailGallery
          tablo={tablo}
          finish={finish}
          framedSlotAspect={framedSlotAspect}
          artworkAspect={artworkAspect}
        />
      </div>
      <div className="bk-tablo-detail-copy">
        <p className="bk-meta bk-tablo-detail-eyebrow">original tablo · berlin</p>
        <h1 className="bk-tablo-detail-title">{tabloTitleWithBoundEmDash(tablo.title)}</h1>
        <p className="bk-tablo-detail-price">{priceLabel}</p>
        <p className="bk-tablo-detail-frame-spec">
          <span className="bk-tablo-detail-frame-size">{frameSizeLabel(orientation)}</span>
          <span className="bk-meta bk-tablo-detail-frame-dir">
            {dir.en} · <span className="bk-text-fa" lang="fa">{dir.fa}</span>
          </span>
        </p>
        {tablo.description ? <TabloDescription text={tablo.description} /> : null}
        <TabloFrameFinishPicker
          tablo={tablo}
          value={finish}
          onChange={setFinish}
          idPrefix="detail"
          mode="shop"
        />
        <div className="bk-tablo-detail-cta">
          <a
            href={buyHref}
            className="bk-btn bk-btn-primary bk-tablo-buy-lg"
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {tabloBuyLabel(tablo)}
          </a>
          <TabloBuyFinishNote tablo={tablo} finish={finish} external={external} />
        </div>
      </div>
    </>
  );
}
