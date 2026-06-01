import type { AgentStateType } from "../../state.js";

/**
 * 每轮 run 开始时，将作品级长记忆（profile / inspiration / plan / creation）
 * 从 API 注入的 input 同步到 graph state。对话历史（messages）仍由 checkpoint 管理。
 */
export function hydrateWorkMemoryNode(
  state: AgentStateType,
): Partial<AgentStateType> {
  return {
    profile: state.profile,
    inspiration: state.inspiration,
    plan: state.plan,
    creation: state.creation,
  };
}
