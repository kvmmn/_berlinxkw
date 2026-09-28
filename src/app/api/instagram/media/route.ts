import { NextResponse } from "next/server";
import { authorizeInstagramPortal } from "@/lib/instagram/auth-request";
import { uploadInstagramJpeg } from "@/lib/instagram/media";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!(await authorizeInstagramPortal())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Missing file field (JPEG)" }, { status: 400 });
  }

  const origin = new URL(req.url).origin;
  const result = await uploadInstagramJpeg(file);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    pathname: result.pathname,
    publicUrl: result.publicUrl,
    absoluteUrl: result.publicUrl.startsWith("http")
      ? result.publicUrl
      : `${origin}${result.publicUrl}`,
  });
}
