import type { FrameFinish, Tablo } from "./types";

export const FRAME_FINISHES: readonly FrameFinish[] = [
  "bronze",
  "matte-black-brushed",
  "matte-steel-brushed",
] as const;

const FINISH_SET = new Set<string>(FRAME_FINISHES);

export function isFrameFinish(value: string): value is FrameFinish {
  return FINISH_SET.has(value);
}

export type FrameFinishLabel = { en: string; fa: string; swatch: string };

export const FRAME_FINISH_LABELS: Record<FrameFinish, FrameFinishLabel> = {
  bronze: { en: "Bronze", fa: "برنز", swatch: "linear-gradient(135deg, #8a6b3d, #c9a962)" },
  "matte-black-brushed": {
    en: "Matte black brushed",
    fa: "مشکی مات برس‌خورده",
    swatch: "linear-gradient(135deg, #1a1a1a, #4a4a4a)",
  },
  "matte-steel-brushed": {
    en: "Matte steel brushed",
    fa: "استیل مات برس‌خورده",
    swatch: "linear-gradient(135deg, #6b7078, #b8bcc4)",
  },
};

/** Portal helper: framed mockups must match artwork orientation (no crop/rotate to force portrait). */
export const FRAMED_SAMPLE_ORIENTATION_HINT =
  "Framed sample photos must match the artwork orientation (landscape stays landscape, portrait stays portrait). Do not crop or rotate the artwork to force a frame shape.";

export const FRAMED_SAMPLE_ORIENTATION_HINT_FA =
  "عکس نمونهٔ قاب باید همان جهت اثر باشد (افقی افقی، عمودی عمودی). اثر را برای قاب برش ندهید و نچرخانید.";

/** How artwork, finishes, and framed samples fit together on `/portal/tablos`. */
export const TABLO_PRESENTATION_OVERVIEW_EN =
  "Shop presentation: (1) artwork = flat original on `image`; (2) frame finishes = structured checkboxes saved as `frameFinishes` + `defaultFrameFinish` — buyers pick on the public listing; (3) framed sample = optional `framedImage` wall photo on the listing. Finishes do not require a mockup to list; add samples when ready.";

export const TABLO_PRESENTATION_OVERVIEW_FA =
  "نمایش فروشگاه: (۱) اثر تخت در `image`؛ (۲) جنس قاب = فیلدهای ثابت JSON برای انتخاب خریدار؛ (۳) نمونهٔ قاب = `framedImage` اختیاری. برای انتشار لازم نیست mockup داشته باشید.";

export const TABLO_FRAMED_SAMPLE_HELPER_EN =
  "Optional. Shown on the shop after artwork. One upload is reused for every enabled finish until per-finish assets exist in `framedImagesByFinish`. Automated mockup runs are separate — upload real photos here.";

export const TABLO_FRAMED_SAMPLE_HELPER_FA =
  "اختیاری. بعد از اثر نمایش داده می‌شود. یک عکس برای همهٔ جنس‌های فعال کافی است تا تصویر جدا per-finish اضافه شود.";

export function parseFrameFinishes(raw: unknown): FrameFinish[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: FrameFinish[] = [];
  for (const item of raw) {
    if (typeof item === "string" && isFrameFinish(item) && !out.includes(item)) {
      out.push(item);
    }
  }
  return out.length > 0 ? out : undefined;
}

/** Listed finishes for a tablo; defaults to all three when unset (legacy tablos). */
export function tabloFrameFinishes(tablo: Tablo): FrameFinish[] {
  const fromTablo = tablo.frameFinishes?.filter(isFrameFinish);
  if (fromTablo && fromTablo.length > 0) return fromTablo;
  return [...FRAME_FINISHES];
}

/** Default buyer selection; falls back to bronze. */
export function tabloDefaultFrameFinish(tablo: Tablo): FrameFinish {
  const available = tabloFrameFinishes(tablo);
  const candidate = tablo.defaultFrameFinish;
  if (candidate && isFrameFinish(candidate) && available.includes(candidate)) {
    return candidate;
  }
  if (available.includes("bronze")) return "bronze";
  return available[0] ?? "bronze";
}

export function coerceFrameFinish(tablo: Tablo, finish: string | null | undefined): FrameFinish {
  const available = tabloFrameFinishes(tablo);
  if (finish && isFrameFinish(finish) && available.includes(finish)) return finish;
  return tabloDefaultFrameFinish(tablo);
}

/** Short grid meta: bronze · black · steel */
export function tabloFrameFinishesGridMeta(tablo: Tablo): string {
  const abbrev: Record<FrameFinish, string> = {
    bronze: "bronze",
    "matte-black-brushed": "black",
    "matte-steel-brushed": "steel",
  };
  return tabloFrameFinishes(tablo).map((f) => abbrev[f]).join(" · ");
}

export function normalizeTabloFrameFields(tablo: Tablo): Tablo {
  const frameFinishes = tabloFrameFinishes(tablo);
  const defaultFrameFinish = tabloDefaultFrameFinish(tablo);
  return {
    ...tablo,
    frameFinishes,
    defaultFrameFinish,
  };
}
