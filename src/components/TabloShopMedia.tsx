import {
  tabloArtworkImage,
  tabloFramedImageForFinish,
  tabloProductImage,
} from "@/lib/tablo-images";
import { FRAME_FINISHES, FRAME_FINISH_LABELS } from "@/lib/frame-finish";
import { TabloPicture, tabloPictureSizes } from "@/components/TabloPicture";
import { intrinsicDimensionsFromAspect } from "@/lib/tablo-image-intrinsic";
import { aspectRatioFromImage } from "@/lib/tablo-aspect";
import type { FrameFinish, Tablo } from "@/lib/types";

function isSvgSrc(src: string, mime?: string): boolean {
  if (mime === "image/svg+xml") return true;
  const path = src.split("?")[0] ?? "";
  return path.endsWith(".svg");
}

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
  /** Native `<img>` only — stable SSR/hydration for multi-figure detail galleries. */
  stableImg?: boolean;
};

function MediaFrame({
  src,
  alt,
  mime,
  sizes,
  priority,
  aspectRatio,
  stableImg = false,
}: MediaFrameProps) {
  const dims = intrinsicDimensionsFromAspect(aspectRatio);
  return (
    <div className="bk-tablo-detail-figure-media" style={{ aspectRatio }}>
      {stableImg || isSvgSrc(src, mime) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="bk-tablo-picture"
          width={dims.width}
          height={dims.height}
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          data-fit="contain"
        />
      ) : (
        <TabloPicture
          src={src}
          alt={alt}
          mime={mime}
          sizes={sizes}
          priority={priority}
          layout="contain"
          width={dims.width}
          height={dims.height}
        />
      )}
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
  const aspectForDims = aspectRatioFromImage(product, aspectRatio);
  const dims = intrinsicDimensionsFromAspect(aspectForDims);

  return (
    <div className="bk-aspect-frame bk-tablo-tile-media" style={{ aspectRatio }}>
      <TabloPicture
        src={product.url}
        alt={productAlt(tablo, kind)}
        mime={product.mime}
        sizes={tabloPictureSizes("card")}
        layout={fit}
        priority={priority}
        width={dims.width}
        height={dims.height}
      />
    </div>
  );
}

/** SSR: all finish variants in the DOM; visibility toggled via CSS :has() on finish radios in the grid. */
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
                stableImg
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
            stableImg
          />
          <figcaption className="bk-meta bk-tablo-detail-caption">artwork</figcaption>
        </figure>
      ) : null}
    </div>
  );
}
