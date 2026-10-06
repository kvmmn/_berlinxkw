/** Parse a single `Range: bytes=` header value against a known resource size. */
export function parseByteRange(
  rangeHeader: string | null,
  size: number,
): { start: number; end: number } | "unsatisfiable" | null {
  if (!rangeHeader || size <= 0) return null;
  const match = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim());
  if (!match) return null;

  let start = match[1] ? Number.parseInt(match[1], 10) : NaN;
  let end = match[2] ? Number.parseInt(match[2], 10) : NaN;

  if (match[1] === "" && match[2] !== "") {
    const suffixLength = end;
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) return null;
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    if (!Number.isFinite(start) || start < 0) return null;
    if (match[2] === "") {
      end = size - 1;
    } else if (!Number.isFinite(end) || end < start) {
      return null;
    }
  }

  if (start >= size) return "unsatisfiable";
  end = Math.min(end, size - 1);
  return { start, end };
}

export function contentRangeHeader(start: number, end: number, size: number): string {
  return `bytes ${start}-${end}/${size}`;
}
