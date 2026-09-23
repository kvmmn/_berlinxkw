import Link from "next/link";
import { TabloPicture, tabloPictureSizes } from "@/components/TabloPicture";
import { tabloDefaultFrameFinish, tabloFrameFinishesGridMeta } from "@/lib/frame-finish";
import { tabloFramedImageForFinish, tabloProductImage } from "@/lib/tablo-images";
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
}: {
  tablo: Tablo;
  priority?: boolean;
}) {
  const product = tabloProductImage(tablo, tabloDefaultFrameFinish(tablo));
  const framed = tabloFramedImageForFinish(tablo);
  const alt = framed
    ? `${tablo.title} — framed tablo on wall`
    : `${tablo.title} — original artwork`;

  return (
    <article className="bk-tablo-gallery-item">
      <Link href={`/shop/${tablo.slug}`} className="bk-tablo-gallery-media">
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
      <div className="bk-tablo-gallery-caption">
        <Link href={`/shop/${tablo.slug}`}>
          <h2 className="bk-tablo-gallery-title">{tablo.title}</h2>
        </Link>
        <p className="bk-meta bk-tablo-gallery-meta">
          <span>{formatEur(tablo.priceEur)}</span>
          <span aria-hidden="true"> · </span>
          <span>frame {tabloFrameFinishesGridMeta(tablo)}</span>
        </p>
      </div>
    </article>
  );
}
