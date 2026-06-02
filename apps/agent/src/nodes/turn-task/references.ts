import { runReferencesTask } from "../../lib/turn-task-runners.js";
import type { AgentStateType } from "../../state.js";

export async function turnTaskReferencesNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  return runReferencesTask(state);
}
