import { NextResponse } from "next/server";
import { defaultCaptionDraft, slugifyTablo } from "@/lib/shop-url";
import {
  applyFrameFinishFieldsFromForm,
  applyFrameFinishFieldsFromJson,
} from "@/lib/tablo-frame-api";
import { applyFramedMultipartUploads } from "@/lib/tablo-framed-upload";
import { deleteTabloImage, uploadTabloImage, withPortalTabloImages } from "@/lib/tablo-media";
import { loadState, saveState } from "@/lib/storage";
import type { TabloStatus } from "@/lib/types";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const contentType = req.headers.get("content-type") ?? "";

  const { state } = await loadState();
  const tablo = state.tablos?.find((t) => t.id === id);
  if (!tablo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const title = form.has("title") ? String(form.get("title") ?? "").trim() : tablo.title;
    const description = form.has("description")
      ? String(form.get("description") ?? "").trim()
      : tablo.description;
    const slugRaw = form.has("slug") ? String(form.get("slug") ?? "").trim() : tablo.slug;
    const priceRaw = form.has("priceEur") ? String(form.get("priceEur") ?? "").trim() : "";
    const statusRaw = form.has("status")
      ? (String(form.get("status") ?? "").trim() as TabloStatus)
      : tablo.status;
    const marketplaceUrl = form.has("marketplaceUrl")
      ? String(form.get("marketplaceUrl") ?? "").trim()
      : (tablo.marketplaceUrl ?? "");
    const captionDraft = form.has("captionDraft")
      ? String(form.get("captionDraft") ?? "").trim()
      : (tablo.captionDraft ?? "");

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (form.has("priceEur")) {
      const priceEur = Number.parseFloat(priceRaw);
      if (!Number.isFinite(priceEur) || priceEur < 0) {
        return NextResponse.json({ error: "Valid price in EUR is required" }, { status: 400 });
      }
      tablo.priceEur = priceEur;
    }

    const validStatuses: TabloStatus[] = ["draft", "listed", "sold"];
    if (form.has("status") && validStatuses.includes(statusRaw)) {
      tablo.status = statusRaw;
    }

    const nextSlug = slugifyTablo(slugRaw || title);
    if (nextSlug !== tablo.slug) {
      const taken = state.tablos?.some((t) => t.id !== id && t.slug === nextSlug);
      if (taken) {
        return NextResponse.json({ error: "Slug already in use" }, { status: 400 });
      }
      tablo.slug = nextSlug;
    }

    tablo.title = title;
    tablo.description = description;
    tablo.marketplaceUrl = marketplaceUrl || undefined;
    tablo.captionDraft = captionDraft || defaultCaptionDraft(title);

    const artworkFile = form.get("artwork") ?? form.get("image");
    if (artworkFile instanceof File && artworkFile.size > 0) {
      if (tablo.image) await deleteTabloImage(tablo.image);
      const uploaded = await uploadTabloImage(id, artworkFile, "artwork");
      if ("error" in uploaded) {
        return NextResponse.json({ error: uploaded.error }, { status: 400 });
      }
      tablo.image = uploaded.image;
    }

    const frameResult = applyFrameFinishFieldsFromForm(tablo, form);
    if (!frameResult.ok) {
      return NextResponse.json({ error: frameResult.error }, { status: 400 });
    }

    const framedResult = await applyFramedMultipartUploads(id, tablo, form);
    if (!framedResult.ok) {
      return NextResponse.json({ error: framedResult.error }, { status: 400 });
    }
  } else {
    const body = (await req.json()) as {
      title?: string;
      slug?: string;
      description?: string;
      priceEur?: number;
      status?: TabloStatus;
      marketplaceUrl?: string;
      captionDraft?: string;
      frameFinishes?: unknown;
      defaultFrameFinish?: unknown;
    };

    if (body.title !== undefined) {
      const title = body.title.trim();
      if (!title) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
      }
      tablo.title = title;
    }
    if (body.description !== undefined) tablo.description = body.description.trim();
    if (body.priceEur !== undefined) {
      if (!Number.isFinite(body.priceEur) || body.priceEur < 0) {
        return NextResponse.json({ error: "Valid price in EUR is required" }, { status: 400 });
      }
      tablo.priceEur = body.priceEur;
    }
    if (body.status) {
      const validStatuses: TabloStatus[] = ["draft", "listed", "sold"];
      if (validStatuses.includes(body.status)) tablo.status = body.status;
    }
    if (body.marketplaceUrl !== undefined) {
      tablo.marketplaceUrl = body.marketplaceUrl.trim() || undefined;
    }
    if (body.captionDraft !== undefined) {
      tablo.captionDraft = body.captionDraft.trim() || defaultCaptionDraft(tablo.title);
    }
    if (body.slug !== undefined) {
      const nextSlug = slugifyTablo(body.slug.trim() || tablo.title);
      const taken = state.tablos?.some((t) => t.id !== id && t.slug === nextSlug);
      if (taken) {
        return NextResponse.json({ error: "Slug already in use" }, { status: 400 });
      }
      tablo.slug = nextSlug;
    }

    const frameResult = applyFrameFinishFieldsFromJson(tablo, body);
    if (!frameResult.ok) {
      return NextResponse.json({ error: frameResult.error }, { status: 400 });
    }
  }

  tablo.updatedAt = new Date().toISOString();
  const { ok, mode } = await saveState(state);
  if (!ok) {
    return NextResponse.json({ error: "Could not persist", mode }, { status: 503 });
  }
  return NextResponse.json({ tablo: withPortalTabloImages([tablo])[0] });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const { state } = await loadState();
  const idx = state.tablos?.findIndex((t) => t.id === id) ?? -1;
  if (idx < 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [removed] = state.tablos.splice(idx, 1);
  if (removed.image) await deleteTabloImage(removed.image);
  if (removed.framedImage) await deleteTabloImage(removed.framedImage);
  if (removed.framedImagesByFinish) {
    for (const img of Object.values(removed.framedImagesByFinish)) {
      if (img) await deleteTabloImage(img);
    }
  }

  const { ok, mode } = await saveState(state);
  if (!ok) {
    return NextResponse.json({ error: "Could not persist", mode }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
