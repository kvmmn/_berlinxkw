import { TabloDualMedia } from "@/components/TabloDualMedia";
import { tabloArtworkImage, tabloFramedImage } from "@/lib/tablo-images";
import type { Tablo } from "@/lib/types";

export function TabloCardMedia({ tablo }: { tablo: Tablo }) {
  return (
    <TabloDualMedia
      title={tablo.title}
      artworkUrl={tabloArtworkImage(tablo)?.url}
      framedUrl={tabloFramedImage(tablo)?.url}
      variant="card"
      href={`/shop/${tablo.slug}`}
    />
  );
}

export function TabloDetailGallery({ tablo }: { tablo: Tablo }) {
  return (
    <TabloDualMedia
      title={tablo.title}
      artworkUrl={tabloArtworkImage(tablo)?.url}
      framedUrl={tabloFramedImage(tablo)?.url}
      variant="detail"
    />
  );
}
