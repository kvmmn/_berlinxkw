import {
  GALLERY_PACK_GAP,
  GALLERY_TARGET_ROW_HEIGHT_DESKTOP,
} from "@/lib/tablo-gallery-rows";

/**
 * Deterministic `/_next/image` URLs for native `<img srcset>` (SSR === client bytes).
 * Width list matches common Next.js deviceSizes subset used on product detail.
 */
export const DETAIL_OPTIMIZED_WIDTHS = [640, 828, 1080, 1200, 1920] as const;

/** Justified grid — align with production optimizer buckets (portrait tile widths). */
export const GRID_OPTIMIZED_WIDTHS = [384, 480, 640, 750, 828] as const;

/**
 * Static tile width cap from row target height × typical portrait grow (~0.85).
 * Same constants as SSR `planJustifiedGalleryRows` packing reference.
 */
export const GRID_TILE_SIZES_MAX_PX = Math.round(GALLERY_TARGET_ROW_HEIGHT_DESKTOP * 0.85);

export const GRID_OPTIMIZED_SIZES =
  `(max-width: 720px) calc(100vw - 2.5rem), ` +
  `(max-width: 1024px) min(${GRID_TILE_SIZES_MAX_PX}px, calc((100vw - ${GALLERY_PACK_GAP}px - 2.5rem) / 2)), ` +
  `${GRID_TILE_SIZES_MAX_PX}px`;

export const DETAIL_OPTIMIZE_QUALITY = 75;

/** Fixed `sizes` for detail column — must not depend on viewport at build time. */
export const DETAIL_OPTIMIZED_SIZES = tabloDetailSizesConstant();

function tabloDetailSizesConstant(): string {
  return "(max-width: 768px) 100vw, min(540px, 50vw)";
}

export function nextImageOptimizerUrl(
  src: string,
  width: number,
  quality: number = DETAIL_OPTIMIZE_QUALITY,
): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}

export function nextImageOptimizerSrcSet(
  src: string,
  widths: readonly number[] = DETAIL_OPTIMIZED_WIDTHS,
  quality: number = DETAIL_OPTIMIZE_QUALITY,
): string {
  return widths.map((w) => `${nextImageOptimizerUrl(src, w, quality)} ${w}w`).join(", ");
}

/** Stable fallback `src` (fixed width — never derived from window/DPR). */
export function nextImageOptimizerSrc(
  src: string,
  fallbackWidth: number = 1080,
  quality: number = DETAIL_OPTIMIZE_QUALITY,
): string {
  return nextImageOptimizerUrl(src, fallbackWidth, quality);
}

export type StaticOptimizedImageProps = {
  src: string;
  srcSet: string;
  sizes: string;
  loading: "eager" | "lazy";
  fetchPriority: "high" | "auto";
};

export function buildStaticOptimizedImageProps(
  src: string,
  options: {
    sizes?: string;
    priority?: boolean;
    quality?: number;
    widths?: readonly number[];
    fallbackWidth?: number;
  } = {},
): StaticOptimizedImageProps {
  const {
    sizes = DETAIL_OPTIMIZED_SIZES,
    priority = false,
    quality = DETAIL_OPTIMIZE_QUALITY,
    widths = DETAIL_OPTIMIZED_WIDTHS,
    fallbackWidth = 1080,
  } = options;

  return {
    src: nextImageOptimizerSrc(src, fallbackWidth, quality),
    srcSet: nextImageOptimizerSrcSet(src, widths, quality),
    sizes,
    loading: priority ? "eager" : "lazy",
    fetchPriority: priority ? "high" : "auto",
  };
}
