import { NextResponse } from "next/server";
import { loadState, saveState } from "@/lib/storage";
import type { DecisionStatus } from "@/lib/types";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = (await req.json()) as { status?: DecisionStatus };
  const { state } = await loadState();
  const decision = state.decisions.find((d) => d.id === id);
  if (!decision) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (body.status) decision.status = body.status;
  const { ok, mode } = await saveState(state);
  if (!ok) {
    return NextResponse.json({ error: "Could not persist", mode }, { status: 503 });
  }
  return NextResponse.json({ decision });
}
