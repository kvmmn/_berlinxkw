"use client";

import { useMemo, useState } from "react";
import { TabloFrameFinishPicker } from "@/components/TabloFrameFinishPicker";
import { TabloBuyFinishNote } from "@/components/TabloBuyFinishNote";
import { tabloBuyExternal, tabloBuyLabel, tabloBuyUrl } from "@/lib/shop-buy";
import type { FrameFinish, Tablo } from "@/lib/types";

/** Client-only finish picker + buy CTA; static copy stays SSR in the page. */
export function TabloShopDetailBuyIsland({
  tablo,
  initialFinish,
}: {
  tablo: Tablo;
  initialFinish: FrameFinish;
}) {
  const [finish, setFinish] = useState<FrameFinish>(initialFinish);
  const buyHref = useMemo(() => tabloBuyUrl(tablo, finish), [tablo, finish]);
  const external = tabloBuyExternal(tablo);

  return (
    <>
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
    </>
  );
}
