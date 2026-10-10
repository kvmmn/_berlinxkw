import type { Tablo } from "./types";

type ImprovisationCanonical = {
  improvisationNo: number;
  improvisationLine: string;
};

/** Slug defaults until persisted on each tablo in store (Growth can override via portal). */
const IMPROVISATION_BY_SLUG: Record<string, ImprovisationCanonical> = {
  "berlin-clouds-01": {
    improvisationNo: 1,
    improvisationLine: "one contrail at dusk",
  },
  "berlin-sunset-02": {
    improvisationNo: 2,
    improvisationLine: "ten minutes of orange",
  },
  "berlin-sunset-03": {
    improvisationNo: 3,
    improvisationLine: "Berlin goes gold",
  },
};

export function applyTabloImprovisationFields(tablo: Tablo): Tablo {
  const canonical = IMPROVISATION_BY_SLUG[tablo.slug];
  if (
    !canonical &&
    tablo.improvisationNo == null &&
    (tablo.improvisationLine == null || tablo.improvisationLine === "")
  ) {
    return tablo;
  }

  return {
    ...tablo,
    improvisationNo: tablo.improvisationNo ?? canonical?.improvisationNo,
    improvisationLine: tablo.improvisationLine ?? canonical?.improvisationLine,
  };
}

export function tabloImprovisationLabel(tablo: Tablo): string | null {
  const merged = applyTabloImprovisationFields(tablo);
  const no = merged.improvisationNo;
  if (no == null || !Number.isFinite(no) || no < 1) {
    return null;
  }
  const padded = String(Math.trunc(no)).padStart(2, "0");
  const base = `Improvisation No. ${padded}`;
  const line = merged.improvisationLine?.trim();
  return line ? `${base} — ${line}` : base;
}

/** Listed slugs with canonical improvisation (for ops / PR notes). */
export function improvisationCanonicalSlugs(): string[] {
  return Object.keys(IMPROVISATION_BY_SLUG);
}
