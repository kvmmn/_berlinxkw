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
