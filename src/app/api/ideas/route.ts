import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { v4 as uuidv4 } from "uuid";
import { uploadIdeaMedia } from "@/lib/idea-media";
import { loadState, saveState } from "@/lib/storage";
import type { IdeaInput, IdeaStatus } from "@/lib/types";

export async function GET() {
  const { state } = await loadState();
  const ideas = [...(state.ideas ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return NextResponse.json({ ideas });
}

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const form = await req.formData();
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const tagsRaw = String(form.get("tags") ?? "").trim();
  const statusRaw = String(form.get("status") ?? "inbox").trim() as IdeaStatus;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const tags = tagsRaw
    ? tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : undefined;

  const id = `idea-${uuidv4()}`;
  const media: IdeaInput["media"] = [];

  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  for (const file of files) {
    const uploaded = await uploadIdeaMedia(id, file);
    if ("error" in uploaded) {
      return NextResponse.json({ error: uploaded.error }, { status: 400 });
    }
    media.push(uploaded.media);
  }

  const validStatuses: IdeaStatus[] = ["inbox", "queued", "used", "archived"];
  const status = validStatuses.includes(statusRaw) ? statusRaw : "inbox";

  const idea: IdeaInput = {
    id,
    createdAt: new Date().toISOString(),
    title,
    description,
    media,
    tags,
    status,
  };

  const { state } = await loadState();
  if (!state.ideas) state.ideas = [];
  state.ideas.push(idea);
  const { ok, mode } = await saveState(state);
  if (!ok) {
    return NextResponse.json({ error: "Could not persist idea", mode }, { status: 503 });
  }
  return NextResponse.json({ idea });
}
