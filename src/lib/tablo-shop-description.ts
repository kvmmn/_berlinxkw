const ORIGINAL_PHOTO_MARKER = "Original photo ·";

/** Arabic/Persian blocks — public shop is English-only. */
const PERSIAN_SCRIPT =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/g;

function stripPersianScript(text: string): string {
  let s = text.replace(PERSIAN_SCRIPT, "").trim();
  s = s.replace(/(?:\s*·\s*)+/g, " · ").replace(/^\s*·\s*|\s*·\s*$/g, "").trim();
  return s.replace(/\s{2,}/g, " ");
}

function isCommerceSegment(segment: string): boolean {
  const s = segment.trim();
  if (!s) return true;
  if (/€\s*\d/.test(s)) return true;
  if (/\d+\s*×\s*\d+\s*cm/i.test(s)) return true;
  if (/metal frame|wide mat|with mat|no mat/i.test(s)) return true;
  if (/shipping/i.test(s)) return true;
  if (/free shipping/i.test(s)) return true;
  return false;
}

function stripCommerceSegments(text: string): string {
  const parts = text
    .split(/\s*·\s*/)
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => !isCommerceSegment(p));
  return parts.join(" · ").trim();
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
    return stripPersianScript(after || trimmed);
  }

  const stripped = stripCommerceSegments(trimmed);
  const result = stripped || trimmed;
  return stripPersianScript(result);
}
