import { NextResponse } from "next/server";
import { classifyBlobPathname, isBlobStorePathname } from "@/lib/blob-pathname";
import { streamBlob } from "@/lib/blob-private";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" } as const;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pathname = url.searchParams.get("pathname")?.trim() ?? "";

  if (!pathname || !isBlobStorePathname(pathname)) {
    if (classifyBlobPathname(pathname) === "traversal") {
      console.warn("[blob] rejected pathname traversal attempt", {
        pathnameLength: pathname.length,
        prefix: pathname.slice(0, 64),
      });
    }
    return NextResponse.json({ error: "Invalid pathname" }, { status: 400, headers: NO_STORE });
  }

  const blob = await streamBlob(pathname);
  if (!blob) {
    return new NextResponse("Not found", { status: 404, headers: NO_STORE });
  }

  return new NextResponse(blob.stream, {
    headers: {
      "Content-Type": blob.contentType,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
