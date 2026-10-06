export const FRAME_SHORT_CM = 50;
export const FRAME_LONG_CM = 70;

export type TabloOrientation = "portrait" | "landscape";

export function orientationFromDimensions(
  width: number,
  height: number,
): TabloOrientation {
  return width > height ? "landscape" : "portrait";
}

export function frameDimensionsForOrientation(orientation: TabloOrientation): {
  widthCm: number;
  heightCm: number;
  aspectRatio: string;
} {
  if (orientation === "landscape") {
    return {
      widthCm: FRAME_LONG_CM,
      heightCm: FRAME_SHORT_CM,
      aspectRatio: `${FRAME_LONG_CM} / ${FRAME_SHORT_CM}`,
    };
  }
  return {
    widthCm: FRAME_SHORT_CM,
    heightCm: FRAME_LONG_CM,
    aspectRatio: `${FRAME_SHORT_CM} / ${FRAME_LONG_CM}`,
  };
}

export function frameSizeLabel(orientation: TabloOrientation): string {
  const { widthCm, heightCm } = frameDimensionsForOrientation(orientation);
  return `${widthCm}×${heightCm} cm`;
}

/** Shop / landing grid stage — physical frame ratio, not product JPEG pixels. */
export function frameGridStageAspect(orientation: TabloOrientation): string {
  return frameDimensionsForOrientation(orientation).aspectRatio;
}

/** @deprecated Prefer frameGridCellFlexGrow for row width allocation. */
export function frameGridStageFlexGrow(orientation: TabloOrientation): number {
  const { widthCm, heightCm } = frameDimensionsForOrientation(orientation);
  return widthCm / heightCm;
}

/** Share of row width ∝ catalog frame width (70 cm landscape, 50 cm portrait). */
export function frameGridCellFlexGrow(orientation: TabloOrientation): number {
  return frameDimensionsForOrientation(orientation).widthCm;
}

export function orientationCopy(orientation: TabloOrientation): { en: string; fa: string } {
  return orientation === "landscape"
    ? { en: "landscape", fa: "افقی" }
    : { en: "portrait", fa: "عمودی" };
}

export function frameListingLine(orientation: TabloOrientation): string {
  const size = frameSizeLabel(orientation);
  const dir = orientationCopy(orientation);
  return `${size} · ${dir.en} · ${dir.fa}`;
}
