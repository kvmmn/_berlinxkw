import type { Tablo } from "./types";

/** Slug defaults until persisted on each tablo in store (Growth can override via portal). */
const IMPROVISATION_NO_BY_SLUG: Record<string, number> = {
  "berlin-clouds-01": 1,
  "berlin-sunset-02": 2,
  "berlin-sunset-03": 3,
};

export function applyTabloImprovisationFields(tablo: Tablo): Tablo {
  const canonical = IMPROVISATION_NO_BY_SLUG[tablo.slug];
  if (!canonical && tablo.improvisationNo == null) {
    return tablo;
  }

  return {
    ...tablo,
    improvisationNo: tablo.improvisationNo ?? canonical,
  };
}

export function tabloImprovisationLabel(tablo: Tablo): string | null {
  const merged = applyTabloImprovisationFields(tablo);
  const no = merged.improvisationNo;
  if (no == null || !Number.isFinite(no) || no < 1) {
    return null;
  }
  const padded = String(Math.trunc(no)).padStart(2, "0");
  return `Improvisation No. ${padded}`;
}

/** Listed slugs with canonical improvisation (for ops / PR notes). */
export function improvisationCanonicalSlugs(): string[] {
  return Object.keys(IMPROVISATION_NO_BY_SLUG);
}
