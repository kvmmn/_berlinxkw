import { NextResponse } from "next/server";
import { streamBlob } from "@/lib/blob-private";
import { isPublicTabloBlobPathname } from "@/lib/tablo-media";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pathname = url.searchParams.get("pathname")?.trim() ?? "";

  if (!pathname || !isPublicTabloBlobPathname(pathname)) {
    return NextResponse.json({ error: "Invalid pathname" }, { status: 400 });
  }

  const blob = await streamBlob(pathname);
  if (!blob) {
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
