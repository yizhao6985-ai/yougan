import { runEnsureOutlineTask } from "../../lib/turn-task-runners.js";
import type { AgentStateType } from "../../state.js";

export async function turnTaskEnsureOutlineNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  return runEnsureOutlineTask(state);
}
