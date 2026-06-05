import type { AgentStateType } from "#agent/state.js";
import { runEnsureProfileForProduction } from "./logic.js";

/** 制作子图入口：补全尚不可执行的 profile，再进入规格解析与排产 */
export async function ensureProfileNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  return runEnsureProfileForProduction(state);
}
