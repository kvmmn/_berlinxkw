import { BrainChat } from "@/components/BrainChat";
import { getPortalContext } from "@/lib/portal-data";
import { loadState, saveState } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";
import type { Session } from "@/lib/types";

async function getOrCreateActiveSession(weekId: string): Promise<Session> {
  const { state } = await loadState();
  const existing = [...state.sessions]
    .filter((s) => s.weekId === weekId)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0];
  if (existing) return existing;

  const session: Session = {
    id: `session-${uuidv4()}`,
    weekId,
    startedAt: new Date().toISOString(),
    messages: [],
    decisionIds: [],
  };
  state.sessions.push(session);
  await saveState(state);
  return session;
}

export default async function ChatPage() {
  const { state, currentWeek } = await getPortalContext();
  const session = await getOrCreateActiveSession(currentWeek.id);
  const decisions = state.decisions.filter((d) => session.decisionIds.includes(d.id));

  return (
    <BrainChat session={session} weekId={currentWeek.id} initialDecisions={decisions} />
  );
}
