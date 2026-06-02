import { runUpdateBriefSuggestions } from "./logic.js";
import type { AgentStateType } from "../../state.js";

/** 主图统一建议节点：空 thread 开场建议；灵感回合后根据正文生成快捷选项。 */
export async function updateBriefSuggestionsNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  return runUpdateBriefSuggestions(state);
}
