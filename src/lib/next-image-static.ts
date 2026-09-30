/**
 * Deterministic `/_next/image` URLs for native `<img srcset>` (SSR === client bytes).
 * Width list matches common Next.js deviceSizes subset used on product detail.
 */
export const DETAIL_OPTIMIZED_WIDTHS = [640, 828, 1080, 1200, 1920] as const;

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
