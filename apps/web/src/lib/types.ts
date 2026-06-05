export type {
  BlueprintBeat,
  BlueprintConstraint,
  BriefSuggestion,
  BriefSuggestions,
  ChatMode,
  ExecutedPlanTask,
  ProductionDepartment,
  ProductionPlanTask,
  ReferenceItem,
  RevisionKind,
  UserRevisionPhase,
  WorkBlueprint,
  WorkDraft,
  WorkDTO,
  WorkProductionPlan,
  WorkProfile,
  WorkRevisionDTO,
  WorkRevisionSnapshot,
  YouganAgentState,
  YouganStreamValues,
  YouganAgentSubmitInput,
  TurnQueueKind,
} from "@yougan/domain";

export {
  CHAT_MODES,
  DEFAULT_BRIEF_SUGGESTIONS_HINT,
  EMPTY_WORK_BLUEPRINT,
  EMPTY_WORK_PRODUCTION_PLAN,
  EMPTY_WORK_PROFILE,
  getBlueprintPremise,
  getPlanSummary,
  hasBlueprintContent,
  hasOutlineContent,
  isBlueprintActionable,
  isPlanReady,
  mergeBlueprintState,
  parseBlueprintJson,
  parsePlanJson,
  REVISION_KINDS,
  USER_REVISION_PHASES,
  TURN_QUEUE_KINDS,
} from "@yougan/domain";

export interface WorkGroup {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Work {
  id: string;
  title: string;
  groupId: string | null;
  profile: import("@yougan/domain").WorkProfile;
  blueprint: import("@yougan/domain").WorkBlueprint;
  plan: import("@yougan/domain").WorkProductionPlan;
  draft: import("@yougan/domain").WorkDraft | null;
  headRevisionId: string | null;
  sourceWorkId: string | null;
  sourceRevisionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkConversation {
  id: string;
  workId: string;
  title: string;
  threadId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type YouganValues = import("@yougan/domain").YouganStreamValues;
export type YouganSubmitInput = import("@yougan/domain").YouganAgentSubmitInput;
