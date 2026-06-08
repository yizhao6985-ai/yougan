export type {
  Work,
  WorkVersion,
  WorkVersionSnapshot,
  WorkGroup,
  SyncWorkState,
  AgentContext,
} from "@/services/types";

export type {
  ProfileSegment,
  ProfileGuardrail,
  ProfileDelivery,
  FormatParams,
  NextStepSuggestion,
  NextStepSuggestions,
  ExecutedPlanTask,
  ProductionDepartment,
  ProductionPlanTask,
  Asset,
  HumanAttachmentAsset,
  HumanMessageContentPart,
  WorkReference,
  /** @deprecated Use WorkReference */
  ReferenceItem,
  WorkPreview,
  WorkProductionPlan,
  WorkProfile,
  YouganAgentState,
  YouganStreamValues,
  YouganAgentSubmitInput,
  TurnQueueKind,
} from "@yougan/domain";

export {
  DEFAULT_NEXT_STEP_SUGGESTIONS_HINT,
  EMPTY_WORK_PROFILE,
  EMPTY_WORK_PRODUCTION_PLAN,
  EMPTY_WORK_REFERENCES,
  mergeReferencesForDisplay,
  getProfileSummary,
  getPlanSummary,
  hasProfileContent,
  hasProfileSegments,
  isProfileActionable,
  isPlanReady,
  parseProfileJson,
  parseProductionPlanJson,
  TURN_QUEUE_KINDS,
} from "@yougan/domain";

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
