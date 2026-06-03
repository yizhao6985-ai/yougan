import { syncReferenceImagesFromLatestMessage } from "#agent/lib/sync-reference-images.js"
import type { AgentStateType } from "#agent/state.js"

export async function prepareCreationTurnNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const refPatch = await syncReferenceImagesFromLatestMessage(state);
  return { turnNextStepSuggestions: null, ...refPatch };
}
