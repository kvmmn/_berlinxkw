import Link from "next/link";
import { notFound } from "next/navigation";
import { ShopShell } from "@/components/ShopShell";
import { TabloDescription } from "@/components/TabloDescription";
import { TabloShopDetailShell } from "@/components/TabloShopDetailShell";
import { normalizeTabloFrameFields, tabloDefaultFrameFinish } from "@/lib/frame-finish";
import { tabloArtworkAspect, tabloFramedSlotAspect } from "@/lib/tablo-aspect.server";
import { tabloArtworkOrientation } from "@/lib/tablo-frame-spec.server";
import { frameSizeLabel, orientationCopy } from "@/lib/tablo-frame-spec";
import { tabloTitleWithBoundEmDash } from "@/lib/tablo-title-display";
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
  const initialFinish = tabloDefaultFrameFinish(tablo);
  const [orientation, framedSlotAspect, artworkAspect] = await Promise.all([
    tabloArtworkOrientation(tablo),
    tabloFramedSlotAspect(tablo),
    tabloArtworkAspect(tablo),
  ]);
  const dir = orientationCopy(orientation);

  return (
    <ShopShell>
      <div className="bk-tablo-detail">
        <Link href="/shop" className="bk-meta bk-shop-back">
          ← all tablos
        </Link>
        <div className="bk-tablo-detail-grid">
          <TabloShopDetailShell
            tablo={tablo}
            initialFinish={initialFinish}
            framedSlotAspect={framedSlotAspect}
            artworkAspect={artworkAspect}
          >
            <p className="bk-meta bk-tablo-detail-eyebrow">original tablo · berlin</p>
            <h1 className="bk-tablo-detail-title">{tabloTitleWithBoundEmDash(tablo.title)}</h1>
            <p className="bk-tablo-detail-price">{priceLabel}</p>
            <p className="bk-meta bk-tablo-detail-frame-spec">
              <span className="bk-tablo-detail-frame-size">{frameSizeLabel(orientation)}</span>
              <span aria-hidden="true"> · </span>
              <span className="bk-tablo-detail-frame-dir">{dir.en}</span>
              <span aria-hidden="true"> · </span>
              <span className="bk-text-fa bk-tablo-detail-frame-dir-fa" lang="fa">
                {dir.fa}
              </span>
            </p>
            {tablo.description ? <TabloDescription text={tablo.description} /> : null}
          </TabloShopDetailShell>
        </div>
      </div>
    </ShopShell>
  );
}
