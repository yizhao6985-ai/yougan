export {
  getActiveTurnKind,
  getCompletedTurnKinds,
  getModelTemperature,
  getPreview,
  getProduction,
  getProfile,
  getReferences,
  getTurnQueue,
} from "./get.js";
export {
  cancelledTurnPatch,
  commitPending,
  initPendingTurn,
  isDirtyTurnState,
  mergeTurnPatch,
  normalizeDirtyTurnState,
  requirePending,
  resetTurnRuntime,
} from "./lifecycle.js";
export {
  patchPending,
  patchPendingBatch,
  patchPendingPreview,
  patchPendingProduction,
  patchPendingProductionFields,
  patchPendingProfile,
  patchPendingReferences,
} from "./patch-pending.js";
export { getTurn, patchTurn } from "./turn.js";
import { getCurrentTaskInput } from "@langchain/langgraph";

import type { AgentStateType } from "#agent/state.js";

/** LangGraph `getCurrentTaskInput` 别名，断言为 AgentState。 */
export const getState = getCurrentTaskInput as () => AgentStateType;
