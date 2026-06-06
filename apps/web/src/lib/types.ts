export type {
  ProfileBeat,
  ProfileConstraint,
  NextStepSuggestion,
  NextStepSuggestions,
  ChatMode,
  ExecutedPlanTask,
  ProductionDepartment,
  ProductionPlanTask,
  ReferenceItem,
  RevisionKind,
  UserRevisionPhase,
  WorkPreview,
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
  DEFAULT_NEXT_STEP_SUGGESTIONS_HINT,
  EMPTY_WORK_PROFILE,
  EMPTY_WORK_PRODUCTION_PLAN,
  EMPTY_WORK_REFERENCES,
  getProfilePremise,
  getPlanSummary,
  hasProfileContent,
  hasProfileBeats,
  isProfileActionable,
  isPlanReady,
  mergeProfileState,
  mergeProfileForDisplay,
  parseProfileJson,
  parseProductionPlanJson,
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
  productionPlan: import("@yougan/domain").WorkProductionPlan;
  preview: import("@yougan/domain").WorkPreview | null;
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
