import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { canonicalBlobPathname } from "@/lib/blob-pathname";
import { authorizeInstagramPortal } from "@/lib/instagram/auth-request";
import { IG_UPLOAD_VIDEO_MAX_BYTES, IG_VIDEO_CLIENT_UPLOAD_PATH } from "@/lib/instagram/constants";
import { uploadInstagramJpeg, uploadInstagramMp4 } from "@/lib/instagram/media";

export const runtime = "nodejs";

function assertClientUploadPathname(pathname: string): void {
  const canonical = canonicalBlobPathname(pathname);
  if (!canonical || !IG_VIDEO_CLIENT_UPLOAD_PATH.test(canonical)) {
    throw new Error(
      "Upload pathname must be berlinxkw/instagram/{uuid}/{filename}.mp4 with no traversal.",
    );
  }
}

async function handleClientBlobUpload(req: Request, jsonBody: HandleUploadBody): Promise<Response> {
  const result = await handleUpload({
    request: req,
    body: jsonBody,
    onBeforeGenerateToken: async (pathname) => {
      assertClientUploadPathname(pathname);
      return {
        allowedContentTypes: ["video/mp4"],
        maximumSizeInBytes: IG_UPLOAD_VIDEO_MAX_BYTES,
        addRandomSuffix: true,
        allowOverwrite: false,
      };
    },
  });

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    if (!(await authorizeInstagramPortal())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let jsonBody: unknown;
    try {
      jsonBody = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    try {
      return await handleClientBlobUpload(req, jsonBody as HandleUploadBody);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

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
    return NextResponse.json({ error: "Missing file field (JPEG or MP4)" }, { status: 400 });
  }

  const mime = (file.type || "").toLowerCase();
  const origin = new URL(req.url).origin;
  const result =
    mime === "video/mp4"
      ? await uploadInstagramMp4(file)
      : await uploadInstagramJpeg(file);

  if ("error" in result) {
    const useClientUpload = "useClientUpload" in result && result.useClientUpload === true;
    const status = useClientUpload ? 413 : 400;
    return NextResponse.json(
      {
        error: result.error,
        ...(useClientUpload ? { useClientUpload: true } : {}),
      },
      { status },
    );
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
