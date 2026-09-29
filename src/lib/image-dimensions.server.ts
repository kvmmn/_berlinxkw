import "server-only";
import { readFile } from "fs/promises";
import { join } from "path";
import { jpegDimensionsFromBuffer } from "./instagram/jpeg-dimensions";

function dimensionsFromSvg(buf: Buffer): { width: number; height: number } | null {
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

function dimensionsFromBuffer(
  buf: Buffer,
  mime?: string | null,
): { width: number; height: number } | null {
  const type = mime?.toLowerCase() ?? "";
  if (type.includes("svg") || buf.slice(0, 256).toString("utf8").includes("<svg")) {
    return dimensionsFromSvg(buf);
  }
  if (type.includes("jpeg") || type.includes("jpg") || (buf[0] === 0xff && buf[1] === 0xd8)) {
    return jpegDimensionsFromBuffer(buf);
  }
  return null;
}

function localPublicPath(url: string): string | null {
  if (url.startsWith("/shop/") || url.startsWith("/uploads/")) {
    return join(process.cwd(), "public", url);
  }
  return null;
}

/** Best-effort intrinsic size for shop layout (artwork orientation). Server only. */
export async function probeImageDimensions(
  url: string | undefined,
  mime?: string,
): Promise<{ width: number; height: number } | null> {
  if (!url) return null;

  const local = localPublicPath(url.split("?")[0] ?? url);
  if (local) {
    try {
      const buf = await readFile(local);
      return dimensionsFromBuffer(buf, mime);
    } catch {
      return null;
    }
  }

  if (url.startsWith("/api/shop/media")) {
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://127.0.0.1:3000");
    try {
      const res = await fetch(`${origin}${url}`, {
        headers: { Range: "bytes=0-65535" },
        next: { revalidate: 3600 },
      });
      if (!res.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      return dimensionsFromBuffer(buf, res.headers.get("content-type") ?? mime);
    } catch {
      return null;
    }
  }

  if (url.startsWith("http")) {
    try {
      const res = await fetch(url, { headers: { Range: "bytes=0-65535" } });
      if (!res.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      return dimensionsFromBuffer(buf, res.headers.get("content-type") ?? mime);
    } catch {
      return null;
    }
  }

  return null;
}
