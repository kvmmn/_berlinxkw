import { jpegDimensionsFromBuffer } from "./instagram/jpeg-dimensions";

export type ImageDimensions = { width: number; height: number };

export function dimensionsFromSvg(buf: Buffer): ImageDimensions | null {
  const text = buf.toString("utf8", 0, Math.min(buf.length, 8192));
  const viewBox = text.match(/viewBox=["']([\d.\s-]+)["']/i);
  if (viewBox) {
    const parts = viewBox[1].trim().split(/\s+/).map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      return { width: parts[2], height: parts[3] };
    }
  }
  const wh = text.match(/\bwidth=["']([\d.]+)["'][^>]*\bheight=["']([\d.]+)["']/i);
  if (wh) {
    const width = Number(wh[1]);
    const height = Number(wh[2]);
    if (width > 0 && height > 0) return { width, height };
  }
  return null;
}

export function dimensionsFromBuffer(buf: Buffer, mime?: string | null): ImageDimensions | null {
  const type = mime?.toLowerCase() ?? "";
  if (type.includes("svg") || buf.slice(0, 256).toString("utf8").includes("<svg")) {
    return dimensionsFromSvg(buf);
  }
  if (type.includes("jpeg") || type.includes("jpg") || (buf[0] === 0xff && buf[1] === 0xd8)) {
    return jpegDimensionsFromBuffer(buf);
  }
  return null;
}

/** Parse `pathname` from `/api/shop/media?pathname=…`. */
export function shopMediaPathnameFromUrl(url: string | undefined): string | null {
  if (!url?.startsWith("/api/shop/media")) return null;
  try {
    const u = new URL(url, "http://shop.local");
    return u.searchParams.get("pathname");
  } catch {
    return null;
  }
}
