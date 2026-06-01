import { resolveTurnMode } from "./classify-turn-mode.js";
import type { AgentStateType } from "../../state.js";

/** 每轮用户消息后，根据意图解析 mode 并写入 state，供主图路由。 */
export async function resolveTurnModeNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const mode = await resolveTurnMode(state);
  return { mode };
}
