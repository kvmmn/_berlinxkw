import { NextResponse } from "next/server";
import { classifyBlobPathname, isPublicShopMediaPathname } from "@/lib/blob-pathname";
import { hasBlobToken, streamBlob } from "@/lib/blob-private";
import { IG_DEMO_BLOB_PATH, readDemoPublishSampleJpeg } from "@/lib/instagram/media";

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
    return new NextResponse("Not found", { status: 404, headers: NO_STORE });
  }

  return new NextResponse(blob.stream, {
    headers: {
      "Content-Type": blob.contentType,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
