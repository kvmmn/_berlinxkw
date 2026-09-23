import Link from "next/link";
import { notFound } from "next/navigation";
import { ShopShell } from "@/components/ShopShell";
import { TabloDetailGallery } from "@/components/TabloShopMedia";
import { tabloBuyExternal, tabloBuyLabel, tabloBuyUrl } from "@/lib/shop-buy";
import { withPublicTabloImages } from "@/lib/tablo-media";
import { tablosFromState } from "@/lib/tablo-store";
import { loadState } from "@/lib/storage";

export const dynamic = "force-dynamic";

function formatEur(price: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
}

export default async function TabloDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { state } = await loadState();
  const raw = tablosFromState(state).find((t) => t.slug === slug && t.status === "listed");
  if (!raw) notFound();

  const [tablo] = withPublicTabloImages([raw]);
  const buyHref = tabloBuyUrl(tablo);
  const external = tabloBuyExternal(tablo);
  return (
    <ShopShell meta={tablo.slug}>
      <div className="bk-tablo-detail">
        <Link href="/shop" className="bk-meta bk-shop-back">
          ← all tablos
        </Link>
        <div className="bk-tablo-detail-grid">
          <div className="bk-tablo-detail-media">
            <TabloDetailGallery tablo={tablo} />
          </div>
          <div className="bk-tablo-detail-copy">
            <h1 className="bk-tablo-detail-title">{tablo.title}</h1>
            <p className="bk-meta bk-tablo-detail-price">{formatEur(tablo.priceEur)}</p>
            {tablo.description ? (
              <p className="bk-tablo-detail-desc">{tablo.description}</p>
            ) : null}
            <a
              href={buyHref}
              className="bk-btn bk-btn-primary bk-tablo-buy-lg"
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {tabloBuyLabel(tablo)}
            </a>
            {!external ? (
              <p className="bk-meta bk-tablo-buy-note">
                No marketplace link yet — DM @berlinxkw on Instagram to purchase.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </ShopShell>
  );
}
