import {
  tabloArtworkImage,
  tabloDetailGalleryImages,
  tabloFramedImageForFinish,
  tabloProductImage,
} from "@/lib/tablo-images";
import { TabloPicture, tabloPictureSizes } from "@/components/TabloPicture";
import type { FrameFinish, Tablo } from "@/lib/types";

const DETAIL_SLOT_LABEL: Record<number, string> = {
  0: "framed on wall",
  1: "artwork",
};

function productAlt(tablo: Tablo, kind: "framed" | "artwork" | "product"): string {
  if (kind === "framed") return `${tablo.title} — framed tablo on wall`;
  if (kind === "artwork") return `${tablo.title} — original artwork`;
  const hasFramed = Boolean(tabloFramedImageForFinish(tablo));
  return hasFramed ? `${tablo.title} — framed tablo on wall` : `${tablo.title} — tablo artwork`;
}

export function TabloCardMedia({ tablo }: { tablo: Tablo }) {
  const product = tabloProductImage(tablo);
  if (!product?.url) {
    return <div className="bk-tablo-card-placeholder bk-meta">no image</div>;
  }

  const kind = tabloFramedImageForFinish(tablo) ? "framed" : "artwork";

  return (
    <div className="bk-tablo-card-media-frame">
      <TabloPicture
        src={product.url}
        alt={productAlt(tablo, kind)}
        mime={product.mime}
        sizes={tabloPictureSizes("card")}
        layout="contain"
      />
    </div>
  );
}

export function TabloDetailGallery({
  tablo,
  finish,
}: {
  tablo: Tablo;
  finish?: FrameFinish;
}) {
  const gallery = tabloDetailGalleryImages(tablo, finish);
  const framedForFinish = tabloFramedImageForFinish(tablo, finish);

  if (gallery.length === 0) {
    return <div className="bk-tablo-card-placeholder bk-meta">no image</div>;
  }

  return (
    <div className="bk-tablo-detail-gallery">
      {gallery.map((img, i) => {
        const src = img.url;
        if (!src) return null;
        return (
        <figure key={img.pathname ?? src ?? i} className="bk-tablo-detail-figure">
          <div className="bk-tablo-detail-figure-media">
            <TabloPicture
              src={src}
              alt={`${tablo.title} — ${DETAIL_SLOT_LABEL[i] ?? "photo"}`}
              mime={img.mime}
              sizes={tabloPictureSizes("detail")}
              priority={i === 0}
              layout="contain"
            />
          </div>
          <figcaption className="bk-meta">{DETAIL_SLOT_LABEL[i] ?? "photo"}</figcaption>
        </figure>
        );
      })}
      {tabloArtworkImage(tablo) && !framedForFinish ? (
        <p className="bk-meta bk-tablo-framed-slot">
          framed sample for this finish — coming soon (same orientation as artwork)
        </p>
      ) : null}
    </div>
  );
}
