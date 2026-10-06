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

/** Bronze frame ÷ full JPEG (v4 production mockups). */
export const TABLO_GRID_MOCKUP_FRAME_FRAC = {
  landscape: { w: 1627 / 2400, h: 1228 / 1790 },
  portrait: { w: 1082 / 1790, h: 1541 / 2400 },
} as const;

const MOCKUP_JPEG_ASPECT = { w: 2400, h: 1790 } as const;
const MOCKUP_JPEG_ASPECT_PORTRAIT = { w: 1790, h: 2400 } as const;

/** Full mockup JPEG width (cm) when the 70 cm frame long edge matches catalog size. */
export function tabloGridMockupWidthCmAtScale(orientation: TabloOrientation): number {
  const frac = TABLO_GRID_MOCKUP_FRAME_FRAC[orientation];
  if (orientation === "landscape") {
    return FRAME_LONG_CM / frac.w;
  }
  const mockupHeightCm = FRAME_LONG_CM / frac.h;
  return mockupHeightCm * (MOCKUP_JPEG_ASPECT_PORTRAIT.w / MOCKUP_JPEG_ASPECT_PORTRAIT.h);
}

/** Mockup JPEG height (cm) at the same uniform scale (70 cm long edge). */
export function tabloGridMockupHeightCmAtScale(orientation: TabloOrientation): number {
  const frac = TABLO_GRID_MOCKUP_FRAME_FRAC[orientation];
  if (orientation === "portrait") {
    return FRAME_LONG_CM / frac.h;
  }
  const mockupWidthCm = FRAME_LONG_CM / frac.w;
  return mockupWidthCm * (MOCKUP_JPEG_ASPECT.h / MOCKUP_JPEG_ASPECT.w);
}

/**
 * Horizontal footprint for justified grid cells: full mockup width + symmetric wall pad (~10% of 70 cm).
 */
export function frameGridCellStageWidthCm(
  orientation: TabloOrientation,
  marginRatio: number = TABLO_GRID_STAGE_MARGIN_RATIO,
): number {
  const marginCm = marginRatio * FRAME_LONG_CM;
  return tabloGridMockupWidthCmAtScale(orientation) + 2 * marginCm;
}

/** Tallest mockup in a row ÷ 70 cm long edge — drives equal stage inner height. */
export function rowMockupHeightFactor(row: { orientation: TabloOrientation }[]): number {
  if (row.length === 0) return 1;
  return Math.max(
    ...row.map(
      (item) => tabloGridMockupHeightCmAtScale(item.orientation) / FRAME_LONG_CM,
    ),
  );
}

/** Re-export for gallery row math (avoids circular imports from tablo-grid-mockup-view). */
export const TABLO_GRID_STAGE_MARGIN_RATIO = 0.1;

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
