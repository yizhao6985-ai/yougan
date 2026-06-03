import { syncReferenceImagesFromLatestMessage } from "#agent/lib/sync-reference-images.js"
import { bootstrapOutlineFromBrief } from "#agent/lib/outline/bootstrap-from-brief.js"
import type { AgentStateType } from "#agent/state.js"

export async function prepareOutlineTurnNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const refPatch = await syncReferenceImagesFromLatestMessage(state);
  const merged = { ...state, ...refPatch };
  const outlinePatch = await bootstrapOutlineFromBrief(merged);
  return {
    turnNextStepSuggestions: null,
    ...refPatch,
    ...outlinePatch,
  };
}
