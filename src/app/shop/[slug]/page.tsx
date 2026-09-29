import Link from "next/link";
import { notFound } from "next/navigation";
import { ShopShell } from "@/components/ShopShell";
import { TabloShopDetailBuy } from "@/components/TabloShopDetailBuy";
import { normalizeTabloFrameFields } from "@/lib/frame-finish";
import { tabloArtworkAspect, tabloFramedSlotAspect } from "@/lib/tablo-aspect.server";
import { tabloArtworkOrientation } from "@/lib/tablo-frame-spec.server";
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
  const [orientation, framedSlotAspect, artworkAspect] = await Promise.all([
    tabloArtworkOrientation(tablo),
    tabloFramedSlotAspect(tablo),
    tabloArtworkAspect(tablo),
  ]);
  return (
    <ShopShell>
      <div className="bk-tablo-detail">
        <Link href="/shop" className="bk-meta bk-shop-back">
          ← all tablos
        </Link>
        <div className="bk-tablo-detail-grid">
          <TabloShopDetailBuy
            tablo={tablo}
            priceLabel={priceLabel}
            orientation={orientation}
            framedSlotAspect={framedSlotAspect}
            artworkAspect={artworkAspect}
          />
        </div>
      </div>
    </ShopShell>
  );
}
