import "server-only";

import { tool } from "@langchain/core/tools";
import type { RunnableConfig } from "@langchain/core/runnables";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { STATIC_BRAND_RULES } from "@/agents/brand";
import { getCurrentWeek, getPreviousWeek } from "@/lib/brain";
import { getWeekMetricsSource, isLiveMetricsSource } from "@/lib/metrics-provenance";
import { loadState, saveState } from "@/lib/storage";
import type { Decision, IdeaStatus } from "@/lib/types";

function portalContext(config?: RunnableConfig) {
  const sessionId = String(config?.configurable?.session_id ?? "");
  const weekId = String(config?.configurable?.week_id ?? "");
  return { sessionId, weekId };
}

export const getPortalStateTool = tool(
  async () => {
    const { state } = await loadState();
    const current = getCurrentWeek(state);
    const prev = getPreviousWeek(state, current);
    const currentMetricsSource = getWeekMetricsSource(current);
    const prevMetricsSource = prev ? getWeekMetricsSource(prev) : null;
    const ideas = (state.ideas ?? []).filter(
      (i) => i.status === "inbox" || i.status === "queued",
    );
    return JSON.stringify(
      {
        brainMemory: state.brainMemory,
        metricsProvenance: {
          currentWeek: currentMetricsSource,
          previousWeek: prevMetricsSource,
          isLive: isLiveMetricsSource(currentMetricsSource),
          note:
            currentMetricsSource === "demo"
              ? "Current week metrics are DEMO SEED placeholders — do NOT treat as real @berlinxkw growth. Advisor should enter live metrics on /portal/system (manual or Insights paste/import)."
              : `Current week metrics are LIVE (${currentMetricsSource}) — safe to use for growth analysis.`,
        },
        currentWeek: current,
        previousWeek: prev ?? null,
        openIdeasCount: ideas.length,
        recentDecisions: state.decisions.slice(-12),
        ideasPreview: ideas.slice(0, 10),
      },
      null,
      2,
    );
  },
  {
    name: "get_portal_state",
    description:
      "Load portal AppState snapshot: weeks, metrics, brainMemory, inbox/queued ideas, recent decisions.",
    schema: z.object({}),
  },
);

export const listIdeasTool = tool(
  async (input) => {
    const { state } = await loadState();
    let ideas = [...(state.ideas ?? [])];
    if (input.status) {
      ideas = ideas.filter((i) => i.status === input.status);
    }
    ideas.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return JSON.stringify(ideas.slice(0, input.limit ?? 20), null, 2);
  },
  {
    name: "list_ideas",
    description: "List founder ideas from the Ideas Inbox, optionally filtered by status.",
    schema: z.object({
      status: z
        .enum(["inbox", "queued", "used", "archived"])
        .optional()
        .describe("Filter by idea status"),
      limit: z.number().int().min(1).max(50).optional(),
    }),
  },
);

export const updateIdeaStatusTool = tool(
  async (input) => {
    const { state } = await loadState();
    const idea = (state.ideas ?? []).find((i) => i.id === input.ideaId);
    if (!idea) return JSON.stringify({ ok: false, error: "Idea not found" });
    idea.status = input.status as IdeaStatus;
    if (input.notes !== undefined) idea.notes = input.notes;
    const { ok, mode } = await saveState(state);
    return JSON.stringify({ ok, mode, idea });
  },
  {
    name: "update_idea_status",
    description: "Update an idea status (inbox/queued/used/archived) and optional brain notes.",
    schema: z.object({
      ideaId: z.string(),
      status: z.enum(["inbox", "queued", "used", "archived"]),
      notes: z.string().optional(),
    }),
  },
);

export const listDecisionsTool = tool(
  async (input) => {
    const { state } = await loadState();
    let decisions = [...state.decisions];
    if (input.weekId) {
      decisions = decisions.filter((d) => d.weekId === input.weekId);
    }
    if (input.sessionId) {
      decisions = decisions.filter((d) => d.sessionId === input.sessionId);
    }
    decisions.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return JSON.stringify(decisions.slice(0, input.limit ?? 15), null, 2);
  },
  {
    name: "list_decisions",
    description: "List logged decisions, optionally filtered by week or session.",
    schema: z.object({
      weekId: z.string().optional(),
      sessionId: z.string().optional(),
      limit: z.number().int().min(1).max(50).optional(),
    }),
  },
);

export const proposeDecisionTool = tool(
  async (input, config) => {
    const { sessionId, weekId } = portalContext(config);
    if (!sessionId || !weekId) {
      return JSON.stringify({ ok: false, error: "Missing session_id or week_id in graph config" });
    }
    const { state } = await loadState();
    const session = state.sessions.find((s) => s.id === sessionId);
    if (!session) {
      return JSON.stringify({ ok: false, error: "Session not found" });
    }
    const decision: Decision = {
      id: `dec-${uuidv4()}`,
      sessionId,
      weekId,
      text: input.text.trim(),
      owner: "brain",
      status: "proposed",
      createdAt: new Date().toISOString(),
    };
    state.decisions.push(decision);
    session.decisionIds.push(decision.id);
    const { ok, mode } = await saveState(state);
    return JSON.stringify({ ok, mode, decision });
  },
  {
    name: "propose_decision",
    description:
      "Persist a proposed decision for the current advisor session (status proposed). Use for measurable weekly calls.",
    schema: z.object({
      text: z.string().describe("One imperative, measurable decision sentence"),
    }),
  },
);

export const getBrandRulesTool = tool(
  async () => {
    const { state } = await loadState();
    return `${STATIC_BRAND_RULES}\n\n## Founder steering (brainMemory)\n${state.brainMemory}`;
  },
  {
    name: "get_brand_rules",
    description: "Static brand rules plus founder brainMemory steering markdown.",
    schema: z.object({}),
  },
);

export const ALL_PORTAL_TOOLS = [
  getPortalStateTool,
  listIdeasTool,
  updateIdeaStatusTool,
  listDecisionsTool,
  proposeDecisionTool,
  getBrandRulesTool,
];
