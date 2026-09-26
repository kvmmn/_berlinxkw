import Link from "next/link";
import { notFound } from "next/navigation";
import { ShopShell } from "@/components/ShopShell";
import { TabloShopDetailBuy } from "@/components/TabloShopDetailBuy";
import { normalizeTabloFrameFields } from "@/lib/frame-finish";
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

  const [tabloRaw] = withPublicTabloImages([raw]);
  const tablo = normalizeTabloFrameFields(tabloRaw);
  const priceLabel = formatEur(tablo.priceEur);
  return (
    <ShopShell meta={tablo.slug}>
      <div className="bk-tablo-detail">
        <Link href="/shop" className="bk-meta bk-shop-back">
          ← all tablos
        </Link>
        <div className="bk-tablo-detail-grid">
          <TabloShopDetailBuy tablo={tablo} priceLabel={priceLabel} />
        </div>
      </div>
    </ShopShell>
  );
}
