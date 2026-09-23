import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { defaultCaptionDraft, slugifyTablo } from "@/lib/shop-url";
import { applyFrameFinishFieldsFromForm } from "@/lib/tablo-frame-api";
import { FRAME_FINISHES, tabloDefaultFrameFinish } from "@/lib/frame-finish";
import { uploadTabloImage, withPortalTabloImages } from "@/lib/tablo-media";
import { loadState, saveState } from "@/lib/storage";
import type { Tablo, TabloStatus } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const { state } = await loadState();
  const tablos = [...(state.tablos ?? [])].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  return NextResponse.json({ tablos: withPortalTabloImages(tablos) });
}

function uniqueSlug(base: string, existing: Tablo[]): string {
  let slug = base || "tablo";
  let n = 0;
  while (existing.some((t) => t.slug === slug)) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const form = await req.formData();
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const slugRaw = String(form.get("slug") ?? "").trim();
  const priceRaw = String(form.get("priceEur") ?? "").trim();
  const statusRaw = String(form.get("status") ?? "draft").trim() as TabloStatus;
  const marketplaceUrl = String(form.get("marketplaceUrl") ?? "").trim();
  const captionDraft = String(form.get("captionDraft") ?? "").trim();

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const priceEur = Number.parseFloat(priceRaw);
  if (!Number.isFinite(priceEur) || priceEur < 0) {
    return NextResponse.json({ error: "Valid price in EUR is required" }, { status: 400 });
  }

  const validStatuses: TabloStatus[] = ["draft", "listed", "sold"];
  const status = validStatuses.includes(statusRaw) ? statusRaw : "draft";

  const { state } = await loadState();
  if (!state.tablos) state.tablos = [];

  const baseSlug = slugifyTablo(slugRaw || title);
  const slug = uniqueSlug(baseSlug, state.tablos);

  const id = `tablo-${uuidv4()}`;
  let image: Tablo["image"] = null;
  let framedImage: Tablo["framedImage"] = null;

  const artworkFile = form.get("artwork") ?? form.get("image");
  if (artworkFile instanceof File && artworkFile.size > 0) {
    const uploaded = await uploadTabloImage(id, artworkFile, "artwork");
    if ("error" in uploaded) {
      return NextResponse.json({ error: uploaded.error }, { status: 400 });
    }
    image = uploaded.image;
  }

  const framedFile = form.get("framed");
  if (framedFile instanceof File && framedFile.size > 0) {
    const uploaded = await uploadTabloImage(id, framedFile, "framed");
    if ("error" in uploaded) {
      return NextResponse.json({ error: uploaded.error }, { status: 400 });
    }
    framedImage = uploaded.image;
  }

  const now = new Date().toISOString();
  const tablo: Tablo = {
    id,
    createdAt: now,
    updatedAt: now,
    title,
    slug,
    description,
    priceEur,
    status,
    image,
    framedImage: framedImage ?? undefined,
    frameFinishes: [...FRAME_FINISHES],
    defaultFrameFinish: "bronze",
    marketplaceUrl: marketplaceUrl || undefined,
    captionDraft: captionDraft || defaultCaptionDraft(title),
  };

  const frameResult = applyFrameFinishFieldsFromForm(tablo, form);
  if (!frameResult.ok) {
    return NextResponse.json({ error: frameResult.error }, { status: 400 });
  }
  tablo.defaultFrameFinish = tabloDefaultFrameFinish(tablo);

  state.tablos.push(tablo);
  const { ok, mode } = await saveState(state);
  if (!ok) {
    return NextResponse.json({ error: "Could not persist tablo", mode }, { status: 503 });
  }
  return NextResponse.json({ tablo: withPortalTabloImages([tablo])[0] });
}
