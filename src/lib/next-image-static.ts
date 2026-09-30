import {
  GALLERY_PACK_GAP,
  GALLERY_PACK_REFERENCE_WIDTH,
  GALLERY_TARGET_ROW_HEIGHT_DESKTOP,
} from "@/lib/tablo-gallery-rows";

/**
 * Deterministic `/_next/image` URLs for native `<img srcset>` (SSR === client bytes).
 * Width list matches common Next.js deviceSizes subset used on product detail.
 */
export const DETAIL_OPTIMIZED_WIDTHS = [640, 828, 1080, 1200, 1920] as const;

/**
 * Default Next.js `images.deviceSizes` / `images.imageSizes` when `next.config` omits them.
 * Must stay in sync with Next defaults — custom config requires updating this list.
 */
export const NEXT_DEFAULT_DEVICE_SIZES = [
  640, 750, 828, 1080, 1200, 1920, 2048, 3840,
] as const;

export const NEXT_DEFAULT_IMAGE_SIZES = [16, 32, 48, 64, 96, 128, 256, 384] as const;

const NEXT_ALLOWED_OPTIMIZER_WIDTHS = new Set<number>([
  ...NEXT_DEFAULT_DEVICE_SIZES,
  ...NEXT_DEFAULT_IMAGE_SIZES,
]);

/** Justified grid — allowed Next optimizer widths only (no custom next.config). */
export const GRID_OPTIMIZED_WIDTHS = [384, 640, 750, 828, 1080] as const;

/** All static srcset width lists used in the app. */
export const STATIC_OPTIMIZER_WIDTH_LISTS = {
  grid: GRID_OPTIMIZED_WIDTHS,
  detail: DETAIL_OPTIMIZED_WIDTHS,
} as const;

export function assertStaticOptimizerWidthsAllowed(): void {
  for (const [name, widths] of Object.entries(STATIC_OPTIMIZER_WIDTH_LISTS)) {
    for (const w of widths) {
      if (!NEXT_ALLOWED_OPTIMIZER_WIDTHS.has(w)) {
        throw new Error(
          `Static srcset width ${w} (${name}) is not in Next.js default deviceSizes/imageSizes`,
        );
      }
    }
  }
}

assertStaticOptimizerWidthsAllowed();

/**
 * Widest landscape tile at desktop row height (~430px @ 360px row), from packing reference.
 * Used as the desktop `sizes` cap so DPR2 landscape tiles reach ≥828/1080w.
 */
/** ~430px at 360px desktop row height (widest landscape in reference packing). */
export const GRID_LANDSCAPE_TILE_MAX_PX = Math.round(
  GALLERY_TARGET_ROW_HEIGHT_DESKTOP * (430 / 360),
);

/** Share of gallery row width for the widest landscape cell (reference pack width). */
const GRID_LANDSCAPE_ROW_WIDTH_SHARE = GRID_LANDSCAPE_TILE_MAX_PX / GALLERY_PACK_REFERENCE_WIDTH;

export const GRID_OPTIMIZED_SIZES =
  `(max-width: 720px) calc(100vw - 2.5rem), ` +
  `(max-width: 1024px) min(${GRID_LANDSCAPE_TILE_MAX_PX}px, calc((100vw - ${GALLERY_PACK_GAP}px - 2.5rem) * ${GRID_LANDSCAPE_ROW_WIDTH_SHARE})), ` +
  `${GRID_LANDSCAPE_TILE_MAX_PX}px`;

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
