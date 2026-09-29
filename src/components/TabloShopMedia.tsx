import {
  tabloArtworkImage,
  tabloFramedImageForFinish,
  tabloProductImage,
} from "@/lib/tablo-images";
import { FRAME_FINISH_LABELS } from "@/lib/frame-finish";
import { TabloAspectFrame } from "@/components/TabloAspectFrame";
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
}: {
  tablo: Tablo;
  aspectRatio: string;
}) {
  const product = tabloProductImage(tablo);
  if (!product?.url) {
    return <div className="bk-tablo-card-placeholder bk-meta">no image</div>;
  }

  const kind = tabloFramedImageForFinish(tablo) ? "framed" : "artwork";

  return (
    <TabloAspectFrame aspectRatio={aspectRatio} className="bk-tablo-tile-media">
      <TabloPicture
        src={product.url}
        alt={productAlt(tablo, kind)}
        mime={product.mime}
        sizes={tabloPictureSizes("card")}
        layout="cover"
      />
    </TabloAspectFrame>
  );
}

export function TabloDetailGallery({
  tablo,
  finish,
  framedSlotAspect,
  artworkAspect,
}: {
  tablo: Tablo;
  finish?: FrameFinish;
  framedSlotAspect: string;
  artworkAspect: string;
}) {
  const artwork = tabloArtworkImage(tablo);
  const framed = tabloFramedImageForFinish(tablo, finish);
  const finishLabel = finish ? FRAME_FINISH_LABELS[finish] : null;

  if (!artwork?.url && !framed?.url) {
    return <div className="bk-tablo-card-placeholder bk-meta">no image</div>;
  }

  return (
    <div className="bk-tablo-detail-gallery">
      <figure className="bk-tablo-detail-figure">
        {framed?.url ? (
          <MediaFrame
            src={framed.url}
            alt={`${tablo.title} — framed tablo on wall`}
            mime={framed.mime}
            sizes={tabloPictureSizes("detail")}
            priority
            aspectRatio={framedSlotAspect}
          />
        ) : (
          <div
            className="bk-tablo-detail-figure-media bk-tablo-detail-figure-empty"
            style={{ aspectRatio: framedSlotAspect }}
          >
            <p className="bk-meta bk-tablo-framed-slot">
              Framed mockup for {finishLabel?.en ?? "this finish"} — coming soon
            </p>
          </div>
        )}
        <figcaption className="bk-meta bk-tablo-detail-caption">
          framed · {finishLabel?.en ?? "finish"}
        </figcaption>
      </figure>

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
