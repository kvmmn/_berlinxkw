import {
  tabloArtworkImage,
  tabloFramedImageForFinish,
  tabloProductImage,
} from "@/lib/tablo-images";
import { FRAME_FINISHES, FRAME_FINISH_LABELS } from "@/lib/frame-finish";
import { TabloPicture, tabloPictureSizes } from "@/components/TabloPicture";
import type { FrameFinish, Tablo } from "@/lib/types";

function productAlt(tablo: Tablo, kind: "framed" | "artwork" | "product"): string {
  if (kind === "framed") return `${tablo.title} — framed tablo on wall`;
  if (kind === "artwork") return `${tablo.title} — original artwork`;
  const hasFramed = Boolean(tabloFramedImageForFinish(tablo));
  return hasFramed ? `${tablo.title} — framed tablo on wall` : `${tablo.title} — tablo artwork`;
}

type MediaFrameProps = {
  src: string;
  alt: string;
  mime?: string;
  sizes: string;
  priority?: boolean;
  aspectRatio: string;
};

function MediaFrame({ src, alt, mime, sizes, priority, aspectRatio }: MediaFrameProps) {
  return (
    <div className="bk-tablo-detail-figure-media" style={{ aspectRatio }}>
      <TabloPicture
        src={src}
        alt={alt}
        mime={mime}
        sizes={sizes}
        priority={priority}
        layout="contain"
      />
    </div>
  );
}

export function TabloCardMedia({
  tablo,
  aspectRatio,
  fit = "cover",
  priority = false,
}: {
  tablo: Tablo;
  aspectRatio: string;
  fit?: "contain" | "cover";
  priority?: boolean;
}) {
  const product = tabloProductImage(tablo);
  if (!product?.url) {
    return <div className="bk-tablo-card-placeholder bk-meta">no image</div>;
  }

  const kind = tabloFramedImageForFinish(tablo) ? "framed" : "artwork";

  return (
    <div className="bk-aspect-frame bk-tablo-tile-media" style={{ aspectRatio }}>
      <TabloPicture
        src={product.url}
        alt={productAlt(tablo, kind)}
        mime={product.mime}
        sizes={tabloPictureSizes("card")}
        layout={fit}
        priority={priority}
      />
    </div>
  );
}

/** SSR: all finish variants in the DOM; visibility toggled via `data-finish` on the detail root. */
export function TabloDetailGalleryAllFinishes({
  tablo,
  framedSlotAspect,
  artworkAspect,
}: {
  tablo: Tablo;
  framedSlotAspect: string;
  artworkAspect: string;
}) {
  const artwork = tabloArtworkImage(tablo);
  const hasAnyFramed = FRAME_FINISHES.some((finish) => tabloFramedImageForFinish(tablo, finish)?.url);

  if (!artwork?.url && !hasAnyFramed) {
    return <div className="bk-tablo-card-placeholder bk-meta">no image</div>;
  }

  return (
    <div className="bk-tablo-detail-gallery">
      {FRAME_FINISHES.map((finish) => {
        const framed = tabloFramedImageForFinish(tablo, finish);
        const finishLabel = FRAME_FINISH_LABELS[finish];
        return (
          <figure
            key={finish}
            className={`bk-tablo-detail-figure bk-tablo-detail-figure-finish bk-tablo-detail-finish-${finish}`}
          >
            {framed?.url ? (
              <MediaFrame
                src={framed.url}
                alt={`${tablo.title} — framed tablo on wall`}
                mime={framed.mime}
                sizes={tabloPictureSizes("detail")}
                priority={finish === FRAME_FINISHES[0]}
                aspectRatio={framedSlotAspect}
              />
            ) : (
              <div
                className="bk-tablo-detail-figure-media bk-tablo-detail-figure-empty"
                style={{ aspectRatio: framedSlotAspect }}
              >
                <p className="bk-meta bk-tablo-framed-slot">
                  Framed mockup for {finishLabel.en} — coming soon
                </p>
              </div>
            )}
            <figcaption className="bk-meta bk-tablo-detail-caption">
              framed · {finishLabel.en}
            </figcaption>
          </figure>
        );
      })}

      {artwork?.url ? (
        <figure className="bk-tablo-detail-figure">
          <MediaFrame
            src={artwork.url}
            alt={`${tablo.title} — original artwork`}
            mime={artwork.mime}
            sizes={tabloPictureSizes("detail")}
            aspectRatio={artworkAspect}
          />
          <figcaption className="bk-meta bk-tablo-detail-caption">artwork</figcaption>
        </figure>
      ) : null}
    </div>
  );
}
