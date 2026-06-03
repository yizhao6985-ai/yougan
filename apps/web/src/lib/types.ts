export type {
  BriefRequirement,
  BriefSuggestion,
  BriefSuggestions,
  ChatMode,
  ExecutedPlanTask,
  OutlineSection,
  ProductionDepartment,
  ProductionPlanTask,
  ReferenceItem,
  RevisionKind,
  UserRevisionPhase,
  WorkBrief,
  WorkDraft,
  WorkDTO,
  WorkOutline,
  WorkProductionPlan,
  WorkProfile,
  WorkRevisionDTO,
  WorkRevisionSnapshot,
  YouganAgentState,
  YouganStreamValues,
  TurnQueueKind,
} from "@yougan/domain";

export {
  CHAT_MODES,
  DEFAULT_BRIEF_SUGGESTIONS_HINT,
  EMPTY_WORK_BRIEF,
  EMPTY_WORK_OUTLINE,
  EMPTY_WORK_PRODUCTION_PLAN,
  EMPTY_WORK_PROFILE,
  getOutlineSummary,
  getPlanSummary,
  hasBriefContent,
  hasOutlineContent,
  isPlanReady,
  mergeBriefState,
  mergeOutlineState,
  newBriefRequirement,
  parseBriefJson,
  parseOutlineJson,
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
  brief: import("@yougan/domain").WorkBrief;
  outline: import("@yougan/domain").WorkOutline;
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

export interface YouganValues
  extends Partial<import("@yougan/domain").YouganStreamValues>,
    Record<string, unknown> {}
