const ORIGINAL_PHOTO_MARKER = "Original photo ·";

/** Arabic/Persian blocks — public shop is English-only. */
const PERSIAN_SCRIPT =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/g;

/** ZWNJ/ZWJ etc. often left behind after removing Persian words. */
const BIDI_AND_FORMAT_CHARS = /[\u200c\u200d\u2060\ufeff\u061c\u180e]/g;

function collapseMiddotSegments(text: string): string {
  return text
    .split(/\s*·\s*/)
    .map((part) => part.replace(BIDI_AND_FORMAT_CHARS, "").trim())
    .filter(Boolean)
    .join(" · ")
    .trim();
}

function stripPersianScript(text: string): string {
  const withoutPersian = text
    .replace(PERSIAN_SCRIPT, "")
    .replace(BIDI_AND_FORMAT_CHARS, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return collapseMiddotSegments(withoutPersian);
}

function isCommerceSegment(segment: string): boolean {
  const s = segment.trim();
  if (!s) return true;
  if (/original photo/i.test(s)) return true;
  if (/€\s*\d/.test(s)) return true;
  if (/\d+\s*×\s*\d+\s*cm/i.test(s)) return true;
  if (/fine-art print|fine art print/i.test(s)) return true;
  if (/handmade/i.test(s)) return true;
  if (/metal frame|wide mat|with mat|no mat/i.test(s)) return true;
  if (/brass|matte black|brushed steel|matte-black|matte-steel/i.test(s)) return true;
  if (/shipping|versand|ships framed/i.test(s)) return true;
  if (/free shipping/i.test(s)) return true;
  return false;
}

function stripCommerceSegments(text: string): string {
  const parts = text
    .split(/\s*·\s*/)
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => !isCommerceSegment(p));
  return collapseMiddotSegments(parts.join(" · "));
}

/** Public shop copy — omit stored price / frame / shipping lines from Blob descriptions. */
export function sanitizeTabloDescriptionForShop(description: string): string {
  const trimmed = description.trim();
  if (!trimmed) return trimmed;

  const markerIdx = trimmed.indexOf(ORIGINAL_PHOTO_MARKER);
  if (markerIdx >= 0) {
    const before = stripCommerceSegments(trimmed.slice(0, markerIdx));
    if (before) return stripPersianScript(before);
    const after = stripCommerceSegments(trimmed.slice(markerIdx + ORIGINAL_PHOTO_MARKER.length));
    return stripPersianScript(after);
  }

  const stripped = stripCommerceSegments(trimmed);
  const result = stripped || trimmed;
  return stripPersianScript(result);
}
