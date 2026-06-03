import { runCreativeDirector } from "./logic.js";
import type { AgentStateType } from "#agent/state.js"

export async function creativeDirectorNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  return runCreativeDirector(state);
}
