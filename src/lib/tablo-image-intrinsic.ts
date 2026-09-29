/** Stable intrinsic pixel size for next/image (matches stored mockup long edge). */
export function intrinsicDimensionsFromAspect(
  aspect: string,
  longEdge = 2400,
): { width: number; height: number } {
  const parts = aspect
    .trim()
    .split("/")
    .map((p) => Number.parseFloat(p.trim()));
  if (parts.length !== 2 || !parts.every((n) => Number.isFinite(n) && n > 0)) {
    return { width: longEdge, height: Math.round((longEdge * 3) / 4) };
  }
  const [w, h] = parts;
  if (w >= h) {
    return { width: longEdge, height: Math.round((longEdge * h) / w) };
  }
  return { width: Math.round((longEdge * w) / h), height: longEdge };
}
