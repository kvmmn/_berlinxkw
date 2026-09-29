"use client";

import Link from "next/link";
import { TabloOrientedMediaFrame } from "@/components/TabloOrientedMediaFrame";
import { TabloPicture, tabloPictureSizes } from "@/components/TabloPicture";
import { tabloDefaultFrameFinish } from "@/lib/frame-finish";
import { tabloArtworkImage, tabloFramedImageForFinish, tabloProductImage } from "@/lib/tablo-images";
import { useTabloOrientation } from "@/lib/tablo-orientation-client";
import { frameSizeLabel, type TabloOrientation } from "@/lib/tablo-frame-spec";
import type { Tablo } from "@/lib/types";

function formatEur(price: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
}

export function TabloGalleryTile({
  tablo,
  priority = false,
  orientation: initialOrientation = "portrait",
}: {
  tablo: Tablo;
  priority?: boolean;
  orientation?: TabloOrientation;
}) {
  const orientation = useTabloOrientation(initialOrientation, tabloArtworkImage(tablo)?.url);
  const product = tabloProductImage(tablo, tabloDefaultFrameFinish(tablo));
  const framed = tabloFramedImageForFinish(tablo);
  const alt = framed
    ? `${tablo.title} — framed tablo on wall`
    : `${tablo.title} — original artwork`;

  return (
    <article className="bk-tablo-gallery-item">
      <TabloOrientedMediaFrame orientation={orientation} className="bk-tablo-gallery-media">
        <Link href={`/shop/${tablo.slug}`} className="bk-tablo-gallery-media-link">
          {product?.url ? (
            <TabloPicture
              src={product.url}
              alt={alt}
              mime={product.mime}
              sizes={tabloPictureSizes("landing")}
              priority={priority}
              layout="contain"
            />
          ) : (
            <span className="bk-tablo-gallery-placeholder bk-meta">no image</span>
          )}
        </Link>
      </TabloOrientedMediaFrame>
      <div className="bk-tablo-gallery-caption">
        <Link href={`/shop/${tablo.slug}`}>
          <h2 className="bk-tablo-gallery-title">{tablo.title}</h2>
        </Link>
        <p className="bk-meta bk-tablo-gallery-meta">
          <span>{formatEur(tablo.priceEur)}</span>
          <span aria-hidden="true"> · </span>
          <span>{frameSizeLabel(orientation)}</span>
        </p>
      </div>
    </article>
  );
}
