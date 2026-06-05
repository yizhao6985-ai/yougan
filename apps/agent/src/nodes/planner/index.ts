import { initStagingForTurn } from "#agent/lib/staging-state.js";
import type { AgentStateType } from "#agent/state.js";
import { planTurnQueue } from "./plan-queue.js";

/** 编排本轮：解析 turnQueue 并 fork staging 工作区 */
export async function orchestrateTurnNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const { turnQueue } = await planTurnQueue(state);
  const staging = initStagingForTurn(state, turnQueue);

  return {
    turnQueue,
    suggestedConversationTitle: null,
    completedTurnKinds: [],
    activeTurnKind: null,
    staging,
    nextStepSuggestions: null,
    turnCancelled: false,
    turnCommitted: false,
  };
}
