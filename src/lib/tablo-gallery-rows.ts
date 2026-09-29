import type { TabloGalleryLayoutItem } from "./tablo-gallery-order";

/** Parse CSS aspect-ratio string (e.g. `4032 / 3024`) to width/height flex-grow weight. */
export function tabloAspectFlexGrow(productAspect: string): number {
  const parts = productAspect
    .trim()
    .split("/")
    .map((p) => Number.parseFloat(p.trim()));
  if (parts.length !== 2 || !parts.every((n) => Number.isFinite(n) && n > 0)) {
    return 1;
  }
  return parts[0]! / parts[1]!;
}

export function chunkTabloGalleryRows<T>(items: T[], columns: number): T[][] {
  const cols = Math.max(1, Math.floor(columns));
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += cols) {
    rows.push(items.slice(i, i + cols));
  }
  return rows;
}

export function rowAspectSum(row: TabloGalleryLayoutItem[]): number {
  return row.reduce((sum, item) => sum + tabloAspectFlexGrow(item.productAspect), 0);
}

/** Reference content width for greedy packing (~1240px shell minus gutters). */
export const GALLERY_PACK_REFERENCE_WIDTH = 1140;

/** Row gap used when estimating pack width (matches desktop gallery gap upper bound). */
export const GALLERY_PACK_GAP = 44;

/** Target row height for greedy packing on desktop. */
export const GALLERY_TARGET_ROW_HEIGHT_DESKTOP = 360;

export type JustifiedGalleryRowPlan = {
  items: TabloGalleryLayoutItem[];
  /** `full` rows stretch to gallery width; `tail` is last row left-aligned at reference row height. */
  layout: "full" | "tail";
  /** Pixel height shared with the preceding full row (tail rows only). */
  rowHeightPx?: number;
};

/** Height of a justified row when it fills `referenceWidth` at summed aspect weights. */
export function computeJustifiedRowHeightPx(
  aspectSum: number,
  itemCount: number,
  referenceWidth: number = GALLERY_PACK_REFERENCE_WIDTH,
  gap: number = GALLERY_PACK_GAP,
): number {
  if (itemCount <= 0 || aspectSum <= 0) return GALLERY_TARGET_ROW_HEIGHT_DESKTOP;
  const gaps = Math.max(0, itemCount - 1) * gap;
  return (referenceWidth - gaps) / aspectSum;
}

function balanceSingleTileTail(packed: TabloGalleryLayoutItem[][]): void {
  if (packed.length < 2) return;
  const last = packed[packed.length - 1]!;
  if (last.length !== 1) return;
  const prev = packed[packed.length - 2]!;
  if (prev.length >= 2) {
    last.unshift(prev.pop()!);
  }
}

/**
 * Greedy row packing for justified gallery (SSR). ≤3 tablos always share one full row.
 * Larger sets pack to ~360px row height; the final row is tail-aligned (not stretched).
 * Never leaves a lone tile in the tail — rebalances from the previous row (e.g. 4 → 2+2).
 */
export function planJustifiedGalleryRows(
  items: TabloGalleryLayoutItem[],
  options?: {
    referenceWidth?: number;
    gap?: number;
    targetRowHeight?: number;
  },
): JustifiedGalleryRowPlan[] {
  if (items.length === 0) return [];
  if (items.length <= 3) {
    return [{ items, layout: "full" }];
  }

  const referenceWidth = options?.referenceWidth ?? GALLERY_PACK_REFERENCE_WIDTH;
  const gap = options?.gap ?? GALLERY_PACK_GAP;
  const targetRowHeight = options?.targetRowHeight ?? GALLERY_TARGET_ROW_HEIGHT_DESKTOP;
  const maxAspectPerRow = referenceWidth / targetRowHeight;

  const packed: TabloGalleryLayoutItem[][] = [];
  let current: TabloGalleryLayoutItem[] = [];
  let aspectSum = 0;

  for (const item of items) {
    const aspect = tabloAspectFlexGrow(item.productAspect);
    current.push(item);
    aspectSum += aspect;

    if (current.length >= 3 && aspectSum >= maxAspectPerRow) {
      packed.push(current);
      current = [];
      aspectSum = 0;
    }
  }
  if (current.length > 0) packed.push(current);

  balanceSingleTileTail(packed);

  let referenceRowHeight: number | undefined;

  return packed.map((rowItems, index) => {
    const isLast = index === packed.length - 1;
    const layout = isLast && packed.length > 1 ? "tail" : "full";
    const sum = rowAspectSum(rowItems);

    if (layout === "full") {
      referenceRowHeight = computeJustifiedRowHeightPx(sum, rowItems.length, referenceWidth, gap);
    }

    return {
      items: rowItems,
      layout,
      rowHeightPx: layout === "tail" ? referenceRowHeight : undefined,
    };
  });
}
