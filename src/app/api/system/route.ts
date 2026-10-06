import { NextResponse } from "next/server";
import { AGENT_REGISTRY } from "@/agents/brand";
import { getCheckpointBackend } from "@/agents/checkpointer";
import {
  getLangSmithProjectUrl,
  isLangfuseEnabled,
  isLangSmithTracingEnabled,
} from "@/agents/observability";
import { isAuthenticated } from "@/lib/auth";
import { getStorageMode, loadState, saveState } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { state } = await loadState();
  const storageMode = getStorageMode();
  const checkpointBackend = getCheckpointBackend();

  return NextResponse.json({
    agents: AGENT_REGISTRY,
    storage: {
      appState: storageMode,
      checkpoints: checkpointBackend,
    },
    tracing: {
      langsmith: isLangSmithTracingEnabled(),
      langfuse: isLangfuseEnabled(),
      langsmithProject: process.env.LANGSMITH_PROJECT ?? "berlinxkw",
      langsmithUrl: getLangSmithProjectUrl(),
    },
    brainMemory: state.brainMemory,
  });
}

export async function PATCH(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as { brainMemory?: string };
  if (typeof body.brainMemory !== "string") {
    return NextResponse.json({ error: "brainMemory string required" }, { status: 400 });
  }
  const { state } = await loadState();
  state.brainMemory = body.brainMemory;
  const { ok, mode } = await saveState(state);
  if (!ok) {
    return NextResponse.json(
      { error: "Could not save brainMemory (read-only storage?)", mode },
      { status: 503 },
    );
  }
  return NextResponse.json({ ok: true, mode });
}
