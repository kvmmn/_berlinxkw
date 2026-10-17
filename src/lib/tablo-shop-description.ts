const ORIGINAL_PHOTO_MARKER = "Original photo ·";

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
    if (before) return before;
    const after = stripCommerceSegments(trimmed.slice(markerIdx + ORIGINAL_PHOTO_MARKER.length));
    return after || trimmed;
  }

  const stripped = stripCommerceSegments(trimmed);
  return stripped || trimmed;
}
