import { NextResponse } from "next/server";
import { hasBlobToken, streamBlob } from "@/lib/blob-private";
import {
  IG_DEMO_BLOB_PATH,
  isPublicShopMediaPathname,
  readDemoPublishSampleJpeg,
} from "@/lib/instagram/media";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pathname = url.searchParams.get("pathname")?.trim() ?? "";

  if (!pathname || !isPublicShopMediaPathname(pathname)) {
    return NextResponse.json({ error: "Invalid pathname" }, { status: 400 });
  }

  const blob = hasBlobToken() ? await streamBlob(pathname) : null;
  if (!blob) {
    if (pathname === IG_DEMO_BLOB_PATH) {
      const demo = readDemoPublishSampleJpeg();
      if (demo) {
        return new NextResponse(new Uint8Array(demo), {
          headers: {
            "Content-Type": "image/jpeg",
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
          },
        });
      }
    }
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(blob.stream, {
    headers: {
      "Content-Type": blob.contentType,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
