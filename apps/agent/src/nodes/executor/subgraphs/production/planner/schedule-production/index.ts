import { runScheduleProduction } from "./logic.js";
import type { AgentStateType } from "#agent/state.js";

export async function scheduleProductionNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  return runScheduleProduction(state);
}
