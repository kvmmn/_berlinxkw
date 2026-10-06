import {
  buildStaticOptimizedImageProps,
  DETAIL_OPTIMIZED_SIZES,
} from "@/lib/next-image-static";
import type { TabloPictureLayout } from "@/components/TabloPicture";

function isSvgSrc(src: string, mime?: string): boolean {
  if (mime === "image/svg+xml") return true;
  const path = src.split("?")[0] ?? "";
  return path.endsWith(".svg");
}

/**
 * Raster detail images: native `<img>` with a precomputed `/_next/image` srcset (hydration-safe).
 * SVG stays on the raw asset URL.
 */
export function TabloOptimizedPicture({
  src,
  alt,
  mime,
  sizes = DETAIL_OPTIMIZED_SIZES,
  priority = false,
  layout = "contain",
  className = "bk-tablo-picture",
  width,
  height,
  optimizerWidths,
  optimizerFallbackWidth,
  objectViewBox,
}: {
  src: string;
  alt: string;
  mime?: string;
  sizes?: string;
  priority?: boolean;
  layout?: TabloPictureLayout;
  className?: string;
  width: number;
  height: number;
  optimizerWidths?: readonly number[];
  optimizerFallbackWidth?: number;
  objectViewBox?: string;
}) {
  if (isSvgSrc(src, mime)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        data-fit={layout}
        style={objectViewBox ? { objectViewBox } : undefined}
      />
    );
  }

  const img = buildStaticOptimizedImageProps(src, {
    sizes,
    priority,
    widths: optimizerWidths,
    fallbackWidth: optimizerFallbackWidth,
  });

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={img.src}
      srcSet={img.srcSet}
      sizes={img.sizes}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading={img.loading}
      fetchPriority={img.fetchPriority}
      decoding="async"
      data-fit={layout}
      style={objectViewBox ? { objectViewBox } : undefined}
    />
  );
}
