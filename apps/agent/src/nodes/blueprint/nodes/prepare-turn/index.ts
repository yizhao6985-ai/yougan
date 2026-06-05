import { syncReferenceImagesFromLatestMessage } from "#agent/lib/sync-reference-images.js";
import { bootstrapBlueprintBeats } from "#agent/lib/blueprint/bootstrap-beats.js";
import type { AgentStateType } from "#agent/state.js";

export async function prepareBlueprintTurnNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const refPatch = await syncReferenceImagesFromLatestMessage(state);
  const merged = { ...state, ...refPatch };
  const blueprintPatch = await bootstrapBlueprintBeats(merged);
  return {
    turnNextStepSuggestions: null,
    ...refPatch,
    ...blueprintPatch,
  };
}
