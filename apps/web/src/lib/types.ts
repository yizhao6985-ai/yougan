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
  ProfileSetting,
  ProfileSettingKind,
  ProfileConstraint,
  ProfileIntentStep,
  ProfileDeliveryStep,
  ProfileExpressionStep,
  ProfileStructureStep,
  ProfileConstraintsStep,
  ProfileStepId,
  FormatParams,
  NextStepSuggestion,
  NextStepSuggestions,
  ProductionDepartment,
  ProductionTask,
  Asset,
  HumanAttachmentAsset,
  HumanMessageContentPart,
  WorkReference,
  WorkPreview,
  WorkProduction,
  WorkProfile,
  YouganAgentState,
  YouganStreamValues,
  YouganAgentSubmitInput,
  TurnQueueKind,
  RunProgress,
} from "@yougan/domain";

export { DEFAULT_NEXT_STEP_SUGGESTIONS_HINT } from "@yougan/domain";

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
