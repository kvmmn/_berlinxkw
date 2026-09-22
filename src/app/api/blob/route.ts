import { NextResponse } from "next/server";
import { isBlobStorePathname, streamBlob } from "@/lib/blob-private";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pathname = url.searchParams.get("pathname")?.trim() ?? "";

  if (!pathname || !isBlobStorePathname(pathname)) {
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
      "Cache-Control": "private, max-age=3600",
    },
  });
}
