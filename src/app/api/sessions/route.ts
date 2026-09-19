import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getCurrentWeek } from "@/lib/brain";
import { loadState, saveState } from "@/lib/storage";
import type { Session } from "@/lib/types";

export async function GET() {
  const { state } = await loadState();
  return NextResponse.json({ sessions: state.sessions });
}

export async function POST(req: Request) {
  const body = (await req.json()) as { weekId?: string };
  const { state } = await loadState();
  const weekId = body.weekId ?? getCurrentWeek(state).id;
  const session: Session = {
    id: `session-${uuidv4()}`,
    weekId,
    startedAt: new Date().toISOString(),
    messages: [],
    decisionIds: [],
  };
  state.sessions.push(session);
  const { ok, mode } = await saveState(state);
  if (!ok) {
    return NextResponse.json(
      { error: "Persistence unavailable on this deployment. Link Vercel Blob (BLOB_READ_WRITE_TOKEN) or run locally.", session, mode },
      { status: 503 },
    );
  }
  return NextResponse.json({ session });
}
