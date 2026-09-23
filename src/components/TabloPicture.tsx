import Image from "next/image";

function isSvgSrc(src: string, mime?: string): boolean {
  if (mime === "image/svg+xml") return true;
  const path = src.split("?")[0] ?? "";
  return path.endsWith(".svg");
}

export type TabloPictureLayout = "contain" | "cover";

const SIZE_PRESETS = {
  /** Homepage gallery — one or two columns */
  landing: "(max-width: 640px) 100vw, (max-width: 960px) 50vw, 480px",
  /** Shop grid cards */
  card: "(max-width: 640px) 100vw, (max-width: 960px) 50vw, 340px",
  /** Product detail column */
  detail: "(max-width: 768px) 100vw, min(540px, 50vw)",
} as const;

export function tabloPictureSizes(preset: keyof typeof SIZE_PRESETS): string {
  return SIZE_PRESETS[preset];
}

type TabloPictureProps = {
  src: string;
  alt: string;
  mime?: string;
  sizes?: string;
  priority?: boolean;
  layout?: TabloPictureLayout;
  className?: string;
};

/**
 * Raster images use next/image (sizes + lazy load). SVG demo assets stay on `<img>`.
 */
export function TabloPicture({
  src,
  alt,
  mime,
  sizes = SIZE_PRESETS.card,
  priority = false,
  layout = "contain",
  className = "bk-tablo-picture",
}: TabloPictureProps) {
  if (isSvgSrc(src, mime)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={className}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        data-fit={layout}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      data-fit={layout}
    />
  );
}
