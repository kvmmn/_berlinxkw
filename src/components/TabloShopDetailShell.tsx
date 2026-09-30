"use client";

import { useMemo, useState, type ReactNode } from "react";
import { TabloFrameFinishPicker } from "@/components/TabloFrameFinishPicker";
import { TabloBuyFinishNote } from "@/components/TabloBuyFinishNote";
import { tabloBuyExternal, tabloBuyLabel, tabloBuyUrl } from "@/lib/shop-buy";
import type { FrameFinish, Tablo } from "@/lib/types";

/**
 * Client shell for finish picker + buy CTA. Gallery stays an SSR sibling in the page grid
 * (not under this client boundary) so hydration never re-wraps server markup.
 * Finish figure visibility is driven by CSS :has() on the finish radios in this shell.
 */
export function TabloShopDetailShell({
  tablo,
  initialFinish,
  children,
}: {
  tablo: Tablo;
  initialFinish: FrameFinish;
  children: ReactNode;
}) {
  const [finish, setFinish] = useState<FrameFinish>(initialFinish);
  const buyHref = useMemo(() => tabloBuyUrl(tablo, finish), [tablo, finish]);
  const external = tabloBuyExternal(tablo);

  return (
    <div className="bk-tablo-detail-copy">
        {children}
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
  );
}
