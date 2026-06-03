import { runNextStepSuggestions } from "./nodes/run/index.js";
import type { AgentStateType } from "#agent/state.js";

/** 主图统一下一步建议：开屏选题 + 回合末工作建议 */
export async function updateNextStepSuggestionsNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  return runNextStepSuggestions(state);
}
