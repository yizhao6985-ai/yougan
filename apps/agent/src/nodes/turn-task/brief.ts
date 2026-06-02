import { runBriefTask } from "../../lib/turn-task-runners.js";
import type { AgentStateType } from "../../state.js";

export async function turnTaskBriefNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  return runBriefTask(state);
}
