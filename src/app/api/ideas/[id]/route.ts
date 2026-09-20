import { NextResponse } from "next/server";
import { deleteIdeaMedia, withClientMediaUrls } from "@/lib/idea-media";
import { loadState, saveState } from "@/lib/storage";
import type { IdeaStatus } from "@/lib/types";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = (await req.json()) as {
    status?: IdeaStatus;
    notes?: string;
    tags?: string[];
  };

  const { state } = await loadState();
  const idea = state.ideas?.find((i) => i.id === id);
  if (!idea) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const validStatuses: IdeaStatus[] = ["inbox", "queued", "used", "archived"];
  if (body.status && validStatuses.includes(body.status)) {
    idea.status = body.status;
  }
  if (body.notes !== undefined) {
    idea.notes = body.notes;
  }
  if (body.tags !== undefined) {
    idea.tags = body.tags;
  }

  const { ok, mode } = await saveState(state);
  if (!ok) {
    return NextResponse.json({ error: "Could not persist", mode }, { status: 503 });
  }
  return NextResponse.json({ idea: withClientMediaUrls([idea])[0] });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const { state } = await loadState();
  const idx = state.ideas?.findIndex((i) => i.id === id) ?? -1;
  if (idx < 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [removed] = state.ideas.splice(idx, 1);
  for (const m of removed.media) {
    await deleteIdeaMedia(m);
  }

  const { ok, mode } = await saveState(state);
  if (!ok) {
    return NextResponse.json({ error: "Could not persist", mode }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
