"use client";

import { useMemo, useState, type ReactNode } from "react";
import { TabloDetailGallery } from "@/components/TabloShopMedia";
import { TabloFrameFinishPicker } from "@/components/TabloFrameFinishPicker";
import { TabloBuyFinishNote } from "@/components/TabloBuyFinishNote";
import { tabloBuyExternal, tabloBuyLabel, tabloBuyUrl } from "@/lib/shop-buy";
import type { FrameFinish, Tablo } from "@/lib/types";

/**
 * Client shell for finish-dependent gallery + buy CTA. Static copy is passed as SSR children
 * so title/description markup matches the server HTML (avoids hydration drift).
 */
export function TabloShopDetailShell({
  tablo,
  initialFinish,
  framedSlotAspect,
  artworkAspect,
  children,
}: {
  tablo: Tablo;
  initialFinish: FrameFinish;
  framedSlotAspect: string;
  artworkAspect: string;
  children: ReactNode;
}) {
  const [finish, setFinish] = useState<FrameFinish>(initialFinish);
  const buyHref = useMemo(() => tabloBuyUrl(tablo, finish), [tablo, finish]);
  const external = tabloBuyExternal(tablo);

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
