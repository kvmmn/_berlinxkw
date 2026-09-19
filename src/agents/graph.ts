import "server-only";

import { ChatOpenAI } from "@langchain/openai";
import { createSupervisor } from "@langchain/langgraph-supervisor";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import type { CompiledStateGraph } from "@langchain/langgraph";
import { getCheckpointer } from "@/agents/checkpointer";
import {
  BRAND_GUARDIAN_PROMPT,
  CONTENT_STRATEGIST_PROMPT,
  DECISION_SCRIBE_PROMPT,
  GROWTH_ANALYST_PROMPT,
  SUPERVISOR_PROMPT,
} from "@/agents/prompts";
import {
  ALL_PORTAL_TOOLS,
  getBrandRulesTool,
  getPortalStateTool,
  listDecisionsTool,
  listIdeasTool,
  proposeDecisionTool,
  updateIdeaStatusTool,
} from "@/agents/tools/portal-tools";
import { applyLangSmithEnvDefaults } from "@/agents/observability";

let compiledGraph: CompiledStateGraph<unknown, unknown> | null = null;

function createModel() {
  return new ChatOpenAI({
    model: process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini",
    temperature: 0.4,
    streaming: true,
  });
}

export async function getPortalAgentGraph() {
  if (compiledGraph) return compiledGraph;

  applyLangSmithEnvDefaults();
  const llm = createModel();
  const { checkpointer } = await getCheckpointer();

  const brandGuardian = createReactAgent({
    llm,
    tools: [getBrandRulesTool, getPortalStateTool],
    name: "brand_guardian",
    prompt: BRAND_GUARDIAN_PROMPT,
  });

  const contentStrategist = createReactAgent({
    llm,
    tools: [getPortalStateTool, listIdeasTool, updateIdeaStatusTool],
    name: "content_strategist",
    prompt: CONTENT_STRATEGIST_PROMPT,
  });

  const growthAnalyst = createReactAgent({
    llm,
    tools: [getPortalStateTool],
    name: "growth_analyst",
    prompt: GROWTH_ANALYST_PROMPT,
  });

  const decisionScribe = createReactAgent({
    llm,
    tools: [getPortalStateTool, listDecisionsTool, proposeDecisionTool],
    name: "decision_scribe",
    prompt: DECISION_SCRIBE_PROMPT,
  });

  const workflow = createSupervisor({
    agents: [brandGuardian, contentStrategist, growthAnalyst, decisionScribe],
    llm,
    tools: [getPortalStateTool],
    prompt: SUPERVISOR_PROMPT,
    outputMode: "last_message",
  });

  compiledGraph = workflow.compile({ checkpointer }) as CompiledStateGraph<
    unknown,
    unknown
  >;
  return compiledGraph;
}

/** Reset cached graph (tests / hot reload). */
export function resetPortalAgentGraphCache(): void {
  compiledGraph = null;
}

export { ALL_PORTAL_TOOLS };
