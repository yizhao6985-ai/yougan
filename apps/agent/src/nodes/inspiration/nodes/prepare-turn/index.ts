import { syncReferenceImagesFromLatestMessage } from "../../../../lib/sync-reference-images.js"
import type { AgentStateType } from "../../../../state.js"

export async function prepareInspirationTurnNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const refPatch = await syncReferenceImagesFromLatestMessage(state);
  return { turnNextStepSuggestions: null, ...refPatch };
}
