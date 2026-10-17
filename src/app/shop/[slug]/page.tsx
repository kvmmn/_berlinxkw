import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShopShell } from "@/components/ShopShell";
import { TabloDescription } from "@/components/TabloDescription";
import { TabloDetailGalleryAllFinishes } from "@/components/TabloShopMedia";
import { RunEn, RunFa, RunSep } from "@/components/BidiRun";
import { TabloDetailPurchaseBlock } from "@/components/TabloDetailPurchaseBlock";
import { tabloDefaultFrameFinish } from "@/lib/frame-finish";
import { prepareShopTablo } from "@/lib/tablo-shop-prepare";
import { sanitizeTabloDescriptionForShop } from "@/lib/tablo-shop-description";
import { tabloArtworkAspect, tabloFramedSlotAspect } from "@/lib/tablo-aspect.server";
import { tabloArtworkOrientation } from "@/lib/tablo-frame-spec.server";
import { orientationCopy } from "@/lib/tablo-frame-spec";
import {
  formatShopPriceEur,
  tabloShopSizeById,
  tabloSizeFrameLabel,
  tabloSizeMatLabel,
} from "@/lib/tablo-sizes";
import {
  tabloMetaDocumentTitle,
  tabloTitleWithBoundEmDash,
  tabloVisibleTitle,
} from "@/lib/tablo-title-display";
import { COLLECTION_DETAIL_EYEBROW, COLLECTION_SHOP_BACK } from "@/lib/site-brand";
import { withPublicTabloImages } from "@/lib/tablo-media";
import { tablosFromState } from "@/lib/tablo-store";
import { loadState } from "@/lib/storage";
import type { TabloShopSizeId } from "@/lib/types";

export const dynamic = "force-dynamic";

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
  const initialFinish = tabloDefaultFrameFinish(tablo);
  const initialSize: TabloShopSizeId = tablo.sizes.some((s) => s.id === "large")
    ? "large"
    : tablo.sizes[0]?.id ?? "large";
  const [orientation, framedSlotAspect, artworkAspect] = await Promise.all([
    tabloArtworkOrientation(tablo),
    tabloFramedSlotAspect(tablo),
    tabloArtworkAspect(tablo),
  ]);
  const dir = orientationCopy(orientation);
  const description = tablo.description
    ? sanitizeTabloDescriptionForShop(tablo.description)
    : null;

  return (
    <ShopShell>
      <div className="bk-tablo-detail">
        <Link href="/shop" className="bk-meta bk-shop-back">
          {COLLECTION_SHOP_BACK}
        </Link>
        <div
          className="bk-tablo-detail-grid"
          data-default-finish={initialFinish}
          data-default-size={initialSize}
        >
          <div className="bk-tablo-detail-media bk-tablo-detail-root">
            <TabloDetailGalleryAllFinishes
              tablo={tablo}
              orientation={orientation}
              framedSlotAspect={framedSlotAspect}
              artworkAspect={artworkAspect}
              priorityFinish={initialFinish}
              prioritySize={initialSize}
            />
          </div>
          <div className="bk-tablo-detail-copy">
            <p className="bk-meta bk-tablo-detail-eyebrow">{COLLECTION_DETAIL_EYEBROW}</p>
            <h1 className="bk-tablo-detail-title">
              {tabloTitleWithBoundEmDash(tabloVisibleTitle(tablo))}
            </h1>
            {tablo.sizes.map((sizeOpt) => (
              <p
                key={sizeOpt.id}
                className={`bk-tablo-detail-price bk-tablo-detail-price-size-${sizeOpt.id}`}
              >
                {formatShopPriceEur(tabloShopSizeById(sizeOpt.id).priceEur)}
              </p>
            ))}
            {tablo.sizes.map((sizeOpt) => {
              const mat = tabloSizeMatLabel(sizeOpt.id);
              return (
                <p
                  key={sizeOpt.id}
                  className={`bk-tablo-detail-frame-spec bk-tablo-detail-frame-spec-size-${sizeOpt.id}`}
                >
                  <RunEn className="bk-tablo-detail-frame-spec-en">
                    {tabloSizeFrameLabel(sizeOpt.id, orientation)}
                    <RunSep />
                    {mat.en}
                    <RunSep />
                    {dir.en}
                  </RunEn>
                  <RunFa className="bk-tablo-detail-frame-spec-fa">
                    {mat.fa}
                    <RunSep />
                    {dir.fa}
                  </RunFa>
                </p>
              );
            })}
            {description ? <TabloDescription text={description} /> : null}
            <TabloDetailPurchaseBlock
              tablo={tablo}
              orientation={orientation}
              initialFinish={initialFinish}
              initialSize={initialSize}
            />
          </div>
        </div>
      </div>
    </ShopShell>
  );
}
