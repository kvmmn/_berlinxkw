import Link from "next/link";
import { TabloCardMedia } from "@/components/TabloShopMedia";
import { tabloDefaultFrameFinish, tabloFrameFinishesGridMeta } from "@/lib/frame-finish";
import { tabloBuyExternal, tabloBuyLabel, tabloBuyUrl } from "@/lib/shop-buy";
import type { Tablo } from "@/lib/types";

function formatEur(price: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
}

export function TabloCard({ tablo }: { tablo: Tablo }) {
  const buyHref = tabloBuyUrl(tablo, tabloDefaultFrameFinish(tablo));
  const external = tabloBuyExternal(tablo);

  return (
    <article className="bk-tablo-card">
      <Link
        href={`/shop/${tablo.slug}`}
        className="bk-tablo-card-media"
        aria-label={`View ${tablo.title}`}
      >
        <TabloCardMedia tablo={tablo} />
      </Link>
      <div className="bk-tablo-card-body">
        <Link href={`/shop/${tablo.slug}`}>
          <h2 className="bk-tablo-card-title">{tablo.title}</h2>
        </Link>
        <p className="bk-meta bk-tablo-card-price">{formatEur(tablo.priceEur)}</p>
        <p className="bk-meta bk-tablo-card-frames">frame: {tabloFrameFinishesGridMeta(tablo)}</p>
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
