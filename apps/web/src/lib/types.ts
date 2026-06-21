export type {
  Work,
  WorkVersion,
  WorkVersionSnapshot,
  WorkGroup,
  SyncWorkState,
  AgentContext,
} from "@/services/types";

export type {
  ProfileDirection,
  ProfileStyle,
  ProfileSpecItem,
  ProfileStepId,
  ContentFormMediaParams,
  NextStepSuggestion,
  NextStepSuggestions,
  ProductionDepartment,
  ProductionTask,
  Asset,
  HumanAttachmentAsset,
  HumanMessageContentPart,
  WorkReference,
  WorkPreview,
  PreviewBlock,
  WorkProduction,
  WorkProfile,
  WorkRevision,
  RevisionAnchor,
  RevisionIntentSource,
  YouganAgentState,
  YouganStreamValues,
  YouganAgentSubmitInput,
  TurnQueueKind,
  RunProgress,
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
