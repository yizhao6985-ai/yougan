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
    /** 新回合开始：清掉上一轮 verifyTurn 产出的建议与标题建议 */
    suggestedConversationTitle: null,
    nextStepSuggestions: null,
    completedTurnKinds: [],
    activeTurnKind: null,
    staging,
    turnCancelled: false,
    turnCommitted: false,
  };
}
