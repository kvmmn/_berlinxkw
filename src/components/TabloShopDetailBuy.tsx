"use client";

import { useMemo, useState } from "react";
import { TabloDetailGallery } from "@/components/TabloShopMedia";
import { TabloFrameFinishPicker } from "@/components/TabloFrameFinishPicker";
import { coerceFrameFinish, FRAME_FINISH_LABELS } from "@/lib/frame-finish";
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
}: {
  tablo: Tablo;
  priceLabel: string;
}) {
  const [finish, setFinish] = useState<FrameFinish>(() => coerceFrameFinish(tablo, undefined));
  const buyHref = useMemo(() => tabloBuyUrl(tablo, finish), [tablo, finish]);
  const external = tabloBuyExternal(tablo);
  const finishLabel = FRAME_FINISH_LABELS[finish];

  return (
    <>
      <div className="bk-tablo-detail-media">
        <TabloDetailGallery tablo={tablo} finish={finish} />
      </div>
      <div className="bk-tablo-detail-copy">
        <h1 className="bk-tablo-detail-title">{tablo.title}</h1>
        <p className="bk-meta bk-tablo-detail-price">{priceLabel}</p>
        {tablo.description ? <p className="bk-tablo-detail-desc">{tablo.description}</p> : null}
        <TabloFrameFinishPicker tablo={tablo} value={finish} onChange={setFinish} idPrefix="detail" />
        <a
          href={buyHref}
          className="bk-btn bk-btn-primary bk-tablo-buy-lg"
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {tabloBuyLabel(tablo)}
        </a>
        <p className="bk-meta bk-tablo-buy-finish">
          selected: {finishLabel.en} · {finishLabel.fa}
        </p>
        <p className="bk-meta bk-tablo-buy-note">{tabloBuyFinishNote(tablo, finish, external)}</p>
      </div>
    </>
  );
}
