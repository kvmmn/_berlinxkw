import { tabloArtworkImage, tabloFramedImage, tabloGalleryImages } from "@/lib/tablo-images";
import type { Tablo } from "@/lib/types";

const SLOT_LABEL: Record<number, string> = {
  0: "artwork",
  1: "framed sample",
};

export function TabloCardMedia({ tablo }: { tablo: Tablo }) {
  const gallery = tabloGalleryImages(tablo);
  const artworkUrl = tabloArtworkImage(tablo)?.url;
  const framedUrl = tabloFramedImage(tablo)?.url;

  if (gallery.length === 0) {
    return <div className="bk-tablo-card-placeholder bk-meta">no image</div>;
  }

  if (artworkUrl && framedUrl) {
    return (
      <div className="bk-tablo-card-media-stack">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={artworkUrl} alt={`${tablo.title} — artwork`} loading="lazy" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={framedUrl} alt={`${tablo.title} — framed sample`} loading="lazy" />
      </div>
    );
  }

  const single = artworkUrl ?? framedUrl;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={single} alt={tablo.title} loading="lazy" />
  );
}

export function TabloDetailGallery({ tablo }: { tablo: Tablo }) {
  const gallery = tabloGalleryImages(tablo);

  if (gallery.length === 0) {
    return <div className="bk-tablo-card-placeholder bk-meta">no image</div>;
  }

  return (
    <div className="bk-tablo-detail-gallery">
      {gallery.map((img, i) => (
        <figure key={img.pathname ?? img.url ?? i} className="bk-tablo-detail-figure">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.url} alt={`${tablo.title} — ${SLOT_LABEL[i] ?? "photo"}`} />
          <figcaption className="bk-meta">{SLOT_LABEL[i] ?? "photo"}</figcaption>
        </figure>
      ))}
      {tabloArtworkImage(tablo) && !tabloFramedImage(tablo) ? (
        <p className="bk-meta bk-tablo-framed-slot">framed sample — coming soon</p>
      ) : null}
    </div>
  );
}
