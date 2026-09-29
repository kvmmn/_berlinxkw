"use client";

import { useMemo, useState, type ReactNode } from "react";
import { TabloFrameFinishPicker } from "@/components/TabloFrameFinishPicker";
import { TabloBuyFinishNote } from "@/components/TabloBuyFinishNote";
import { tabloBuyExternal, tabloBuyLabel, tabloBuyUrl } from "@/lib/shop-buy";
import type { FrameFinish, Tablo } from "@/lib/types";

/**
 * Client shell for finish picker + buy CTA. Gallery and static copy are SSR siblings/children
 * so first-paint HTML matches (avoids hydration drift from finish-dependent media).
 */
export function TabloShopDetailShell({
  tablo,
  initialFinish,
  gallery,
  children,
}: {
  tablo: Tablo;
  initialFinish: FrameFinish;
  gallery: ReactNode;
  children: ReactNode;
}) {
  const [finish, setFinish] = useState<FrameFinish>(initialFinish);
  const buyHref = useMemo(() => tabloBuyUrl(tablo, finish), [tablo, finish]);
  const external = tabloBuyExternal(tablo);

  return (
    <>
      <div className="bk-tablo-detail-media bk-tablo-detail-root" data-finish={finish}>
        {gallery}
      </div>
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
    </>
  );
}
