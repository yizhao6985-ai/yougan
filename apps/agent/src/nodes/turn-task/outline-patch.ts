import { runOutlinePatchTask } from "../../lib/turn-task-runners.js";
import type { AgentStateType } from "../../state.js";

export async function turnTaskOutlinePatchNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  return runOutlinePatchTask(state);
}
