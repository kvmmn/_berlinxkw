"use client";

import { useMemo, useState } from "react";
import { TabloDetailGallery } from "@/components/TabloShopMedia";
import { TabloFrameFinishPicker } from "@/components/TabloFrameFinishPicker";
import { coerceFrameFinish } from "@/lib/frame-finish";
import { tabloArtworkImage } from "@/lib/tablo-images";
import { useTabloOrientation } from "@/lib/tablo-orientation-client";
import { frameSizeLabel, orientationCopy, type TabloOrientation } from "@/lib/tablo-frame-spec";
import {
  tabloBuyExternal,
  tabloBuyFinishNote,
  tabloBuyLabel,
  tabloBuyUrl,
} from "@/lib/shop-buy";
import type { FrameFinish, Tablo } from "@/lib/types";

export function TabloShopDetailBuy({
  tablo,
  priceLabel,
  orientation: initialOrientation,
}: {
  tablo: Tablo;
  priceLabel: string;
  orientation: TabloOrientation;
}) {
  const [finish, setFinish] = useState<FrameFinish>(() => coerceFrameFinish(tablo, undefined));
  const orientation = useTabloOrientation(initialOrientation, tabloArtworkImage(tablo)?.url);
  const buyHref = useMemo(() => tabloBuyUrl(tablo, finish), [tablo, finish]);
  const external = tabloBuyExternal(tablo);
  const dir = orientationCopy(orientation);

  return (
    <>
      <div className="bk-tablo-detail-media">
        <TabloDetailGallery tablo={tablo} finish={finish} orientation={orientation} />
      </div>
      <div className="bk-tablo-detail-copy">
        <p className="bk-meta bk-tablo-detail-eyebrow">original tablo · berlin</p>
        <h1 className="bk-tablo-detail-title">{tablo.title}</h1>
        <p className="bk-tablo-detail-price">{priceLabel}</p>
        <p className="bk-tablo-detail-frame-spec">
          <span className="bk-tablo-detail-frame-size">{frameSizeLabel(orientation)}</span>
          <span className="bk-meta bk-tablo-detail-frame-dir">
            {dir.en} · <span lang="fa">{dir.fa}</span>
          </span>
        </p>
        {tablo.description ? <p className="bk-tablo-detail-desc">{tablo.description}</p> : null}
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
          <p className="bk-meta bk-tablo-buy-note" aria-live="polite">
            {tabloBuyFinishNote(tablo, finish, external)}
          </p>
        </div>
      </div>
    </>
  );
}
