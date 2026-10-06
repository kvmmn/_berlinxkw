import { NextResponse } from "next/server";
import { classifyBlobPathname, isPublicShopMediaPathname } from "@/lib/blob-pathname";
import { serveShopMedia } from "@/lib/shop-media-serve";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" } as const;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pathname = url.searchParams.get("pathname")?.trim() ?? "";

  if (!pathname || !isPublicShopMediaPathname(pathname)) {
    if (classifyBlobPathname(pathname) === "traversal") {
      console.warn("[shop/media] rejected pathname traversal attempt", {
        pathnameLength: pathname.length,
        prefix: pathname.slice(0, 64),
      });
    }
    return NextResponse.json({ error: "Invalid pathname" }, { status: 400, headers: NO_STORE });
  }

  return serveShopMedia(pathname, req);
}
