import { NextResponse } from "next/server";
import { requirePortalSession } from "@/lib/auth";
import { loadState } from "@/lib/storage";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const denied = await requirePortalSession();
  if (denied) return denied;
  const { id } = await ctx.params;
  const { state } = await loadState();
  const session = state.sessions.find((s) => s.id === id);
  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const decisions = state.decisions.filter((d) => session.decisionIds.includes(d.id));
  return NextResponse.json({ session, decisions });
}
