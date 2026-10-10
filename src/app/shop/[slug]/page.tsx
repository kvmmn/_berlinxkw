import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShopShell } from "@/components/ShopShell";
import { TabloDescription } from "@/components/TabloDescription";
import { TabloDetailGalleryAllFinishes } from "@/components/TabloShopMedia";
import { TabloDetailPurchaseBlock } from "@/components/TabloDetailPurchaseBlock";
import { TabloImprovisationSubtitle } from "@/components/TabloImprovisationSubtitle";
import { tabloDefaultFrameFinish } from "@/lib/frame-finish";
import { prepareShopTablo } from "@/lib/tablo-shop-prepare";
import { tabloArtworkAspect, tabloFramedSlotAspect } from "@/lib/tablo-aspect.server";
import { tabloArtworkOrientation } from "@/lib/tablo-frame-spec.server";
import { frameSizeLabel, orientationCopy } from "@/lib/tablo-frame-spec";
import {
  tabloMetaDocumentTitle,
  tabloTitleWithBoundEmDash,
  tabloVisibleTitle,
} from "@/lib/tablo-title-display";
import { COLLECTION_DETAIL_EYEBROW, COLLECTION_SHOP_BACK } from "@/lib/site-brand";
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { state } = await loadState();
  const raw = tablosFromState(state).find((t) => t.slug === slug && t.status === "listed");
  if (!raw) {
    return { title: "Not found" };
  }
  const tablo = prepareShopTablo(withPublicTabloImages([raw])[0]);
  const title = tabloMetaDocumentTitle(tablo);
  return {
    title,
    description: title,
    openGraph: { title, description: title },
    twitter: { card: "summary_large_image", title, description: title },
  };
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
  const tablo = prepareShopTablo(tabloRaw);
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
          {COLLECTION_SHOP_BACK}
        </Link>
        <div className="bk-tablo-detail-grid" data-default-finish={initialFinish}>
          <div className="bk-tablo-detail-media bk-tablo-detail-root">
            <TabloDetailGalleryAllFinishes
              tablo={tablo}
              framedSlotAspect={framedSlotAspect}
              artworkAspect={artworkAspect}
              priorityFinish={initialFinish}
            />
          </div>
          <div className="bk-tablo-detail-copy">
            <p className="bk-meta bk-tablo-detail-eyebrow">{COLLECTION_DETAIL_EYEBROW}</p>
            <h1 className="bk-tablo-detail-title">
              {tabloTitleWithBoundEmDash(tabloVisibleTitle(tablo))}
            </h1>
            <TabloImprovisationSubtitle tablo={tablo} className="bk-tablo-detail-improvisation" />
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
            <TabloDetailPurchaseBlock tablo={tablo} initialFinish={initialFinish} />
          </div>
        </div>
      </div>
    </ShopShell>
  );
}
