export type {
  BriefRequirement,
  BriefSuggestion,
  BriefSuggestions,
  ChatMode,
  ExecutedPlanTask,
  ProductionDepartment,
  ProductionPlanTask,
  ReferenceItem,
  RevisionKind,
  UserRevisionPhase,
  WorkBrief,
  WorkDraft,
  WorkDTO,
  WorkProductionPlan,
  WorkProfile,
  WorkRevisionDTO,
  WorkRevisionSnapshot,
  YouganAgentState,
  YouganStreamValues,
} from "@yougan/domain";

export {
  CHAT_MODES,
  CHAT_MODE_LABELS,
  DEFAULT_BRIEF_SUGGESTIONS_HINT,
  EMPTY_WORK_BRIEF,
  EMPTY_WORK_PRODUCTION_PLAN,
  EMPTY_WORK_PROFILE,
  getPlanSummary,
  isPlanReady,
  mergeBriefState,
  newBriefRequirement,
  REVISION_KINDS,
  USER_REVISION_PHASES,
} from "@yougan/domain";

export function normalizeChatMode(mode: string): import("@yougan/domain").ChatMode {
  if ((["inspiration", "creation", "ask"] as const).includes(mode as never)) {
    return mode as import("@yougan/domain").ChatMode;
  }
  return "inspiration";
}

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
  mode: import("@yougan/domain").ChatMode;
  threadId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface YouganValues
  extends Partial<import("@yougan/domain").YouganStreamValues>,
    Record<string, unknown> {}
