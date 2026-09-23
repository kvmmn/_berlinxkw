import { tabloImagesInOrder } from "@/lib/tablo-images";
import type { Tablo } from "@/lib/types";

type Variant = "card" | "detail";

export function TabloProductMedia({
  tablo,
  variant = "card",
}: {
  tablo: Tablo;
  variant?: Variant;
}) {
  const images = tabloImagesInOrder(tablo).map((entry) => ({
    ...entry,
    url: entry.image.url,
  }));

  if (images.length === 0) {
    return (
      <div className="bk-tablo-card-placeholder bk-meta">no image</div>
    );
  }

  if (variant === "card") {
    const className =
      images.length > 1 ? "bk-tablo-card-media-stack" : "bk-tablo-card-media-single";
    return (
      <div className={className}>
        {images.map((item) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={item.role} src={item.url} alt={`${tablo.title} — ${item.label}`} loading="lazy" />
        ))}
      </div>
    );
  }

  return (
    <div className="bk-tablo-detail-gallery">
      {images.map((item) => (
        <figure key={item.role} className="bk-tablo-detail-figure">
          <figcaption className="bk-meta bk-tablo-detail-figcap">{item.label}</figcaption>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.url} alt={`${tablo.title} — ${item.label}`} />
        </figure>
      ))}
      {images.length === 1 ? (
        <p className="bk-meta bk-tablo-detail-framed-slot">framed sample — coming soon</p>
      ) : null}
    </div>
  );
}
