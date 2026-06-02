import { runUpdateOutline } from "./logic.js";
import type { AgentStateType } from "../../state.js";

/** 主图节点：brief 定稿且尚无大纲时自动生成内容大纲 */
export async function updateOutlineNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  return runUpdateOutline(state);
}
