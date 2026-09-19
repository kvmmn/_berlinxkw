import { SystemControl } from "@/components/SystemControl";
import { AGENT_REGISTRY } from "@/agents/brand";
import { getCheckpointBackend } from "@/agents/checkpointer";
import {
  getLangSmithProjectUrl,
  isLangfuseEnabled,
  isLangSmithTracingEnabled,
} from "@/agents/observability";
import { getCurrentWeek } from "@/lib/brain";
import { instagramSyncHint, isInstagramSyncConfigured } from "@/lib/instagram-metrics";
import { getStorageMode, loadState } from "@/lib/storage";

export default async function SystemPage() {
  const { state } = await loadState();
  const currentWeek = getCurrentWeek(state);

  const initial = {
    agents: [...AGENT_REGISTRY],
    storage: {
      appState: getStorageMode(),
      checkpoints: getCheckpointBackend(),
    },
    tracing: {
      langsmith: isLangSmithTracingEnabled(),
      langfuse: isLangfuseEnabled(),
      langsmithProject: process.env.LANGSMITH_PROJECT ?? "berlinxkw",
      langsmithUrl: getLangSmithProjectUrl(),
    },
    brainMemory: state.brainMemory,
    currentWeek,
    instagramSync: {
      configured: isInstagramSyncConfigured(),
      hint: instagramSyncHint(),
    },
  };

  return <SystemControl initial={initial} />;
}
