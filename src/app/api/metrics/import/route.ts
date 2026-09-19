import { NextResponse } from "next/server";
import { getCurrentWeek } from "@/lib/brain";
import { extractMetricsFromInsights } from "@/lib/metrics-import";
import { loadState, saveState } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_TEXT = 32_000;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";

  let text: string | undefined;
  let imageBase64: string | undefined;
  let mimeType: string | undefined;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const rawText = form.get("text");
    if (typeof rawText === "string" && rawText.trim()) {
      text = rawText.trim().slice(0, MAX_TEXT);
    }
    const file = form.get("image");
    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: "Image must be under 4 MB" }, { status: 400 });
      }
      mimeType = file.type || "image/png";
      const buf = Buffer.from(await file.arrayBuffer());
      imageBase64 = buf.toString("base64");
    }
  } else {
    const body = (await req.json()) as {
      text?: string;
      imageBase64?: string;
      mimeType?: string;
    };
    if (typeof body.text === "string" && body.text.trim()) {
      text = body.text.trim().slice(0, MAX_TEXT);
    }
    if (typeof body.imageBase64 === "string" && body.imageBase64.trim()) {
      imageBase64 = body.imageBase64.trim();
      mimeType = typeof body.mimeType === "string" ? body.mimeType : "image/png";
      const approxBytes = Math.floor((imageBase64.length * 3) / 4);
      if (approxBytes > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: "Image must be under 4 MB" }, { status: 400 });
      }
    }
  }

  try {
    const extracted = await extractMetricsFromInsights({ text, imageBase64, mimeType });
    const { state } = await loadState();
    const week = getCurrentWeek(state);

    week.metrics = extracted.metrics;
    week.metricsSource = "import";
    week.metricsUpdatedAt = new Date().toISOString();
    if (extracted.dailySnapshots) {
      week.dailySnapshots = extracted.dailySnapshots;
    }
    if (extracted.summary) {
      week.summary = extracted.summary;
    }

    const { ok, mode } = await saveState(state);
    if (!ok) {
      return NextResponse.json(
        { error: "Could not save metrics (read-only storage?)", mode },
        { status: 503 },
      );
    }

    return NextResponse.json({
      ok: true,
      mode,
      weekId: week.id,
      metricsSource: week.metricsSource,
      metrics: week.metrics,
      dailySnapshots: week.dailySnapshots,
      summary: week.summary,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed";
    const status = message.includes("OPENAI_API_KEY") ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
