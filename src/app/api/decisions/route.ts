import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { loadState, saveState } from "@/lib/storage";
import type { Decision, DecisionOwner, DecisionStatus } from "@/lib/types";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    sessionId: string;
    weekId: string;
    text: string;
    owner?: DecisionOwner;
    status?: DecisionStatus;
  };
  if (!body.sessionId || !body.weekId || !body.text?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const { state } = await loadState();
  const session = state.sessions.find((s) => s.id === body.sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  const decision: Decision = {
    id: `dec-${uuidv4()}`,
    sessionId: body.sessionId,
    weekId: body.weekId,
    text: body.text.trim(),
    owner: body.owner ?? "advisor",
    status: body.status ?? "accepted",
    createdAt: new Date().toISOString(),
  };
  state.decisions.push(decision);
  session.decisionIds.push(decision.id);
  const { ok, mode } = await saveState(state);
  if (!ok) {
    return NextResponse.json(
      { error: "Could not persist decision", decision, mode },
      { status: 503 },
    );
  }
  return NextResponse.json({ decision });
}
