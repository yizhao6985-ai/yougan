export {
  getActiveTurnKind,
  getCompletedTurnKinds,
  getModelTemperature,
  getPreview,
  getProductionPlan,
  getProductionStagingMeta,
  getProfile,
  getReferences,
  getTurnQueue,
} from "./get.js";
export {
  commitPending,
  initPendingTurn,
  requirePending,
  rollbackPending,
} from "./lifecycle.js";
export {
  patchPending,
  patchPendingBatch,
  patchPendingPreview,
  patchPendingProductionMeta,
  patchPendingProductionPlan,
  patchPendingProfile,
  patchPendingReferences,
} from "./patch-pending.js";
import { getCurrentTaskInput } from "@langchain/langgraph";

import type { AgentStateType } from "#agent/state.js";

/** LangGraph `getCurrentTaskInput` 别名，断言为 AgentState。 */
export const getState = getCurrentTaskInput as () => AgentStateType;
