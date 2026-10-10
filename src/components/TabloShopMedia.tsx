import {
  tabloArtworkImage,
  tabloFramedImageForFinish,
  tabloProductImage,
} from "@/lib/tablo-images";
import { FRAME_FINISHES, FRAME_FINISH_LABELS } from "@/lib/frame-finish";
import { TabloOptimizedPicture } from "@/components/TabloOptimizedPicture";
import { tabloPictureSizes } from "@/components/TabloPicture";
import {
  GRID_OPTIMIZED_SIZES,
  GRID_OPTIMIZED_WIDTHS,
} from "@/lib/next-image-static";
import { intrinsicDimensionsFromAspect } from "@/lib/tablo-image-intrinsic";
import { aspectRatioFromImage } from "@/lib/tablo-aspect";
import type { TabloOrientation } from "@/lib/tablo-frame-spec";
import { tabloGridDisplayImage } from "@/lib/tablo-grid-display-image";
import { tabloGridStageStyle } from "@/lib/tablo-grid-wall-tone";
import { tabloImageAltSuffix } from "@/lib/tablo-title-display";
import type { FrameFinish, Tablo } from "@/lib/types";

function productAlt(tablo: Tablo, kind: "framed" | "artwork" | "product"): string {
  const hasFramed = Boolean(tabloFramedImageForFinish(tablo));
  if (kind === "product") {
    return tabloImageAltSuffix(tablo, hasFramed ? "framed" : "artwork");
  }
  return tabloImageAltSuffix(tablo, kind);
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
  const dims = intrinsicDimensionsFromAspect(aspectRatio);
  return (
    <div className="bk-tablo-detail-figure-media" style={{ aspectRatio }}>
      <TabloOptimizedPicture
        src={src}
        alt={alt}
        mime={mime}
        sizes={sizes}
        priority={priority}
        layout="contain"
        width={dims.width}
        height={dims.height}
      />
    </div>
  );
}

export function TabloCardMedia({
  tablo,
  aspectRatio,
  fit = "cover",
  priority = false,
  className,
  gridOrientation,
}: {
  tablo: Tablo;
  aspectRatio: string;
  fit?: "contain" | "cover";
  priority?: boolean;
  className?: string;
  /** When set, crop wall mockup to a uniform frame viewport for shop/landing grids. */
  gridOrientation?: TabloOrientation;
}) {
  const product = gridOrientation ? tabloGridDisplayImage(tablo) : tabloProductImage(tablo);
  if (!product?.url) {
    return <div className="bk-tablo-card-placeholder bk-meta">no image</div>;
  }

  const kind = tabloFramedImageForFinish(tablo) ? "framed" : "artwork";
  const aspectForDims = aspectRatioFromImage(product, aspectRatio);
  const dims = intrinsicDimensionsFromAspect(aspectForDims);

  const mediaClass = ["bk-aspect-frame", "bk-tablo-tile-media", className].filter(Boolean).join(" ");
  const alt = productAlt(tablo, kind);
  const pictureProps = {
    src: product.url,
    mime: product.mime,
    sizes: GRID_OPTIMIZED_SIZES,
    optimizerWidths: GRID_OPTIMIZED_WIDTHS,
    optimizerFallbackWidth: 384,
    priority,
    width: dims.width,
    height: dims.height,
  };

  const picture = (
    <TabloOptimizedPicture {...pictureProps} alt={alt} layout={fit} />
  );

  const gridStageStyle = gridOrientation ? tabloGridStageStyle(tablo) : undefined;

  return (
    <div
      className={mediaClass}
      style={gridOrientation ? gridStageStyle : { aspectRatio }}
      data-grid-orientation={gridOrientation}
    >
      {gridOrientation ? (
        <div className="bk-tablo-grid-mockup-inner">
          <TabloOptimizedPicture
            {...pictureProps}
            alt={alt}
            layout="contain"
            className="bk-tablo-grid-frame-mockup"
          />
        </div>
      ) : (
        picture
      )}
    </div>
  );
}

/** SSR: all finish variants in the DOM; visibility toggled via CSS :has() on finish radios in the grid. */
export function TabloDetailGalleryAllFinishes({
  tablo,
  framedSlotAspect,
  artworkAspect,
  priorityFinish,
}: {
  tablo: Tablo;
  framedSlotAspect: string;
  artworkAspect: string;
  /** Which finish figure is visible on first paint (LCP / fetchpriority). */
  priorityFinish: FrameFinish;
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
                alt={tabloImageAltSuffix(tablo, "framed")}
                mime={framed.mime}
                sizes={tabloPictureSizes("detail")}
                priority={finish === priorityFinish}
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
            alt={tabloImageAltSuffix(tablo, "artwork")}
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
