import { FRAME_FINISHES, isFrameFinish, tabloFrameFinishes } from "./frame-finish";
import {
  FRAMED_FINISH_CLEAR_FIELDS,
  FRAMED_FINISH_UPLOAD_FIELDS,
} from "./tablo-framed-upload-fields";
import { deleteTabloImage, uploadTabloImage, type TabloImageSlot } from "./tablo-media";
import type { FrameFinish, Tablo, TabloImage } from "./types";

export { FRAMED_FINISH_CLEAR_FIELDS, FRAMED_FINISH_UPLOAD_FIELDS } from "./tablo-framed-upload-fields";

export function tabloFramedSlotForFinish(finish: FrameFinish): TabloImageSlot {
  return `framed/${finish}`;
}

function fileFromForm(form: FormData, keys: readonly string[]): File | null {
  for (const key of keys) {
    const value = form.get(key);
    if (value instanceof File && value.size > 0) return value;
  }
  return null;
}

function isTruthyFormFlag(form: FormData, keys: readonly string[]): boolean {
  for (const key of keys) {
    if (!form.has(key)) continue;
    const raw = String(form.get(key) ?? "").trim().toLowerCase();
    if (raw === "true" || raw === "1" || raw === "yes") return true;
  }
  return false;
}

function ensureFramedMap(tablo: Tablo): NonNullable<Tablo["framedImagesByFinish"]> {
  if (!tablo.framedImagesByFinish) tablo.framedImagesByFinish = {};
  return tablo.framedImagesByFinish;
}

/** After legacy `framed` upload, mirror into bronze when that finish is available. */
export function mirrorLegacyFramedToBronze(tablo: Tablo, image: TabloImage): void {
  if (!tabloFrameFinishes(tablo).includes("bronze")) return;
  const map = ensureFramedMap(tablo);
  map.bronze = image;
}

async function setPerFinishFramed(
  tabloId: string,
  tablo: Tablo,
  finish: FrameFinish,
  image: TabloImage,
): Promise<void> {
  const map = ensureFramedMap(tablo);
  const prev = map[finish];
  if (prev && prev.pathname !== image.pathname && prev.url !== image.url) {
    await deleteTabloImage(prev);
  }
  map[finish] = image;
}

async function clearPerFinishFramed(tablo: Tablo, finish: FrameFinish): Promise<void> {
  const map = tablo.framedImagesByFinish;
  if (!map?.[finish]) return;
  await deleteTabloImage(map[finish]);
  delete map[finish];
  if (Object.keys(map).length === 0) tablo.framedImagesByFinish = undefined;
}

/**
 * Handles legacy `framed`, per-finish uploads, and clear flags on multipart tablo writes.
 * Call after frame finish fields are applied so bronze availability is current.
 */
export async function applyFramedMultipartUploads(
  tabloId: string,
  tablo: Tablo,
  form: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  for (const finish of FRAME_FINISHES) {
    if (isTruthyFormFlag(form, FRAMED_FINISH_CLEAR_FIELDS[finish])) {
      await clearPerFinishFramed(tablo, finish);
    }
  }

  for (const finish of FRAME_FINISHES) {
    const file = fileFromForm(form, FRAMED_FINISH_UPLOAD_FIELDS[finish]);
    if (!file) continue;
    const uploaded = await uploadTabloImage(tabloId, file, tabloFramedSlotForFinish(finish));
    if ("error" in uploaded) return { ok: false, error: uploaded.error };
    await setPerFinishFramed(tabloId, tablo, finish, uploaded.image);
  }

  const framedFile = form.get("framed");
  if (framedFile instanceof File && framedFile.size > 0) {
    if (tablo.framedImage) await deleteTabloImage(tablo.framedImage);
    const uploaded = await uploadTabloImage(tabloId, framedFile, "framed");
    if ("error" in uploaded) return { ok: false, error: uploaded.error };
    tablo.framedImage = uploaded.image;
    const map = tablo.framedImagesByFinish;
    const prevBronze = map?.bronze;
    mirrorLegacyFramedToBronze(tablo, uploaded.image);
    if (
      prevBronze &&
      prevBronze.pathname !== uploaded.image.pathname &&
      prevBronze.url !== uploaded.image.url
    ) {
      await deleteTabloImage(prevBronze);
    }
  }

  if (String(form.get("clearFramed") ?? "").trim().toLowerCase() === "true") {
    if (tablo.framedImage) await deleteTabloImage(tablo.framedImage);
    tablo.framedImage = null;
  }

  return { ok: true };
}

/** Resolve finish slug from a framed upload field name (for docs/tests). */
export function frameFinishFromFramedUploadField(field: string): FrameFinish | undefined {
  for (const finish of FRAME_FINISHES) {
    if ((FRAMED_FINISH_UPLOAD_FIELDS[finish] as readonly string[]).includes(field)) {
      return finish;
    }
  }
  const dashed = field.match(/^framed-(.+)$/);
  if (dashed && isFrameFinish(dashed[1])) return dashed[1];
  return undefined;
}
