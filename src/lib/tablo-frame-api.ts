import {
  FRAME_FINISHES,
  isFrameFinish,
  parseFrameFinishes,
  tabloDefaultFrameFinish,
  tabloFrameFinishes,
} from "./frame-finish";
import type { FrameFinish, Tablo } from "./types";

export function applyFrameFinishFieldsFromForm(
  tablo: Tablo,
  form: FormData,
): { ok: true } | { ok: false; error: string } {
  if (form.has("frameFinishes")) {
    const raw = String(form.get("frameFinishes") ?? "").trim();
    let parsed: FrameFinish[] | undefined;
    if (raw.startsWith("[")) {
      try {
        parsed = parseFrameFinishes(JSON.parse(raw));
      } catch {
        return { ok: false, error: "Invalid frameFinishes JSON." };
      }
    } else if (raw) {
      parsed = parseFrameFinishes(raw.split(",").map((s) => s.trim()));
    } else {
      parsed = undefined;
    }
    if (!parsed || parsed.length === 0) {
      return { ok: false, error: "At least one frame finish must be available." };
    }
    tablo.frameFinishes = parsed;
  }

  if (form.has("defaultFrameFinish")) {
    const raw = String(form.get("defaultFrameFinish") ?? "").trim();
    if (!raw) {
      tablo.defaultFrameFinish = undefined;
    } else if (!isFrameFinish(raw)) {
      return { ok: false, error: "Invalid default frame finish." };
    } else {
      tablo.defaultFrameFinish = raw;
    }
  }

  const available = tabloFrameFinishes(tablo);
  tablo.frameFinishes = available;
  const def = tabloDefaultFrameFinish(tablo);
  if (!available.includes(def)) {
    return { ok: false, error: "Default frame finish must be one of the available finishes." };
  }
  tablo.defaultFrameFinish = def;

  return { ok: true };
}

export function applyFrameFinishFieldsFromJson(
  tablo: Tablo,
  body: { frameFinishes?: unknown; defaultFrameFinish?: unknown },
): { ok: true } | { ok: false; error: string } {
  if (body.frameFinishes !== undefined) {
    const parsed = parseFrameFinishes(body.frameFinishes);
    if (!parsed || parsed.length === 0) {
      return { ok: false, error: "At least one frame finish must be available." };
    }
    tablo.frameFinishes = parsed;
  }

  if (body.defaultFrameFinish !== undefined) {
    const raw = body.defaultFrameFinish;
    if (raw === null || raw === "") {
      tablo.defaultFrameFinish = undefined;
    } else if (typeof raw !== "string" || !isFrameFinish(raw)) {
      return { ok: false, error: "Invalid default frame finish." };
    } else {
      tablo.defaultFrameFinish = raw;
    }
  }

  const available = tabloFrameFinishes(tablo);
  tablo.frameFinishes = available;
  const def = tabloDefaultFrameFinish(tablo);
  if (!available.includes(def)) {
    return { ok: false, error: "Default frame finish must be one of the available finishes." };
  }
  tablo.defaultFrameFinish = def;

  return { ok: true };
}

export { FRAME_FINISHES, isFrameFinish };
