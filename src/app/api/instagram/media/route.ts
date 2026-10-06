import { handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { authorizeInstagramPortal } from "@/lib/instagram/auth-request";
import { IG_BLOB_PREFIX, IG_UPLOAD_VIDEO_MAX_BYTES } from "@/lib/instagram/constants";
import { uploadInstagramJpeg, uploadInstagramMp4 } from "@/lib/instagram/media";

export const runtime = "nodejs";

async function handleClientBlobUpload(req: Request): Promise<Response> {
  const jsonBody = await req.json();

  const result = await handleUpload({
    request: req,
    body: jsonBody,
    onBeforeGenerateToken: async (pathname) => {
      if (!pathname.startsWith(IG_BLOB_PREFIX)) {
        throw new Error("Upload pathname must start with the Instagram media prefix.");
      }
      if (!pathname.toLowerCase().endsWith(".mp4")) {
        throw new Error("Client upload is supported for .mp4 Reels video only.");
      }
      return {
        allowedContentTypes: ["video/mp4"],
        maximumSizeInBytes: IG_UPLOAD_VIDEO_MAX_BYTES,
        addRandomSuffix: false,
        allowOverwrite: true,
      };
    },
  });

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  if (!(await authorizeInstagramPortal())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return await handleClientBlobUpload(req);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: msg }, { status: 400 });
    }
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
