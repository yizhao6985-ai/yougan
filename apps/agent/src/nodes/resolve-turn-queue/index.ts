import { planTurnQueue } from "./nodes/plan/index.js";
import type { AgentStateType } from "../../state.js";

/** 结构化解析本轮 turnQueue */
export async function resolveTurnQueueNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const { turnQueue, suggestedConversationTitle } = await planTurnQueue(state);
  return {
    turnQueue,
    suggestedConversationTitle: suggestedConversationTitle ?? null,
    completedTurnKinds: [],
    activeTurnKind: null,
  };
}
