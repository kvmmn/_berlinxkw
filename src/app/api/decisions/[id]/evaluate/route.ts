import { NextResponse } from "next/server";
import { loadState, saveState } from "@/lib/storage";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = (await req.json()) as { score?: number; notes?: string };
  if (body.score == null || body.score < 1 || body.score > 5) {
    return NextResponse.json({ error: "score must be 1-5" }, { status: 400 });
  }
  const { state } = await loadState();
  const decision = state.decisions.find((d) => d.id === id);
  if (!decision) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  decision.evaluation = {
    score: body.score,
    notes: body.notes?.trim() ?? "",
    evaluatedAt: new Date().toISOString(),
  };
  const { ok, mode } = await saveState(state);
  if (!ok) {
    return NextResponse.json({ error: "Could not persist evaluation", mode }, { status: 503 });
  }
  return NextResponse.json({ decision });
}
