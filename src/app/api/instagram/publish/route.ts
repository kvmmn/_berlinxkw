import { NextResponse } from "next/server";
import { authorizeInstagramPublish } from "@/lib/instagram/auth-request";
import { ReelsStillProcessingError } from "@/lib/instagram/reels-processing";
import {
  dryRunOrPublish,
  dryRunOrPublishReels,
  hasInstagramPublishCredentials,
  InstagramNotConfiguredError,
} from "@/lib/instagram/service";

export const runtime = "nodejs";
export const maxDuration = 300;

type PublishBody = {
  imageUrls?: unknown;
  caption?: unknown;
  dryRun?: unknown;
  mediaType?: unknown;
  videoUrl?: unknown;
  coverUrl?: unknown;
  shareToFeed?: unknown;
};

function isReelsBody(body: PublishBody): boolean {
  return body.mediaType === "REELS";
}

export async function POST(req: Request) {
  if (!(await authorizeInstagramPublish(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: PublishBody;
  try {
    body = (await req.json()) as PublishBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const dryRun = body.dryRun === true;

  if (isReelsBody(body)) {
    const caption = typeof body.caption === "string" ? body.caption : "";
    const videoUrl = typeof body.videoUrl === "string" ? body.videoUrl : "";
    const coverUrl = typeof body.coverUrl === "string" ? body.coverUrl : undefined;
    const shareToFeed = body.shareToFeed !== false;

    if (!dryRun && !(await hasInstagramPublishCredentials())) {
      return NextResponse.json(
        {
          error: "Instagram publish is not configured (IG_ACCESS_TOKEN missing).",
          code: "instagram_not_configured",
        },
        { status: 503 },
      );
    }

    const reelsRequestStartedAt = Date.now();

    try {
      const result = await dryRunOrPublishReels(
        { videoUrl, caption, coverUrl, shareToFeed },
        dryRun,
        { startedAtMs: reelsRequestStartedAt },
      );

      if (result.dryRun) {
        const status = dryRun ? 200 : result.validation.ok ? 200 : 400;
        return NextResponse.json(
          {
            dryRun: dryRun || !result.validation.ok,
            ok: result.validation.ok,
            mediaType: "REELS",
            validation: result.validation,
          },
          { status },
        );
      }

      return NextResponse.json({
        ok: true,
        dryRun: false,
        mediaType: "REELS",
        mediaId: result.mediaId,
        permalink: result.permalink,
        validation: result.validation,
      });
    } catch (err) {
      if (err instanceof ReelsStillProcessingError) {
        return NextResponse.json(
          {
            ok: false,
            mediaType: "REELS",
            code: "reels_still_processing",
            message: err.message,
            containerId: err.containerId,
          },
          { status: 202 },
        );
      }
      if (err instanceof InstagramNotConfiguredError) {
        return NextResponse.json(
          { error: err.message, code: "instagram_not_configured" },
          { status: 503 },
        );
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[instagram] reels publish failed:", msg);
      return NextResponse.json({ error: msg }, { status: 502 });
    }
  }

  const caption = typeof body.caption === "string" ? body.caption : "";
  const imageUrls = Array.isArray(body.imageUrls)
    ? body.imageUrls.filter((u): u is string => typeof u === "string")
    : [];

  if (!dryRun && !(await hasInstagramPublishCredentials())) {
    return NextResponse.json(
      {
        error: "Instagram publish is not configured (IG_ACCESS_TOKEN missing).",
        code: "instagram_not_configured",
      },
      { status: 503 },
    );
  }

  try {
    const result = await dryRunOrPublish(imageUrls, caption, dryRun);

    if (result.dryRun) {
      const status = dryRun ? 200 : result.validation.ok ? 200 : 400;
      return NextResponse.json(
        {
          dryRun: dryRun || !result.validation.ok,
          ok: result.validation.ok,
          validation: result.validation,
        },
        { status },
      );
    }

    return NextResponse.json({
      ok: true,
      dryRun: false,
      mediaId: result.mediaId,
      permalink: result.permalink,
      validation: result.validation,
    });
  } catch (err) {
    if (err instanceof InstagramNotConfiguredError) {
      return NextResponse.json(
        { error: err.message, code: "instagram_not_configured" },
        { status: 503 },
      );
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[instagram] publish failed:", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
