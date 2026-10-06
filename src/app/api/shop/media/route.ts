import { NextResponse } from "next/server";
import { isPublicShopMediaPathname } from "@/lib/instagram/media";
import { serveShopMedia } from "@/lib/shop-media-serve";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pathname = url.searchParams.get("pathname")?.trim() ?? "";

  if (!pathname || !isPublicShopMediaPathname(pathname)) {
    return NextResponse.json({ error: "Invalid pathname" }, { status: 400 });
  }

  return serveShopMedia(pathname, req);
}
