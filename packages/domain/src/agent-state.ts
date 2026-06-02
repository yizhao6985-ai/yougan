import type { WorkBrief } from "./brief.js";
import type { BriefSuggestions } from "./suggestions.js";
import type { WorkDraft } from "./draft.js";
import type { TurnTaskKind } from "./turn-tasks.js";
import type { WorkOutline } from "./outline.js";
import type { WorkProductionPlan } from "./plan.js";
import type { WorkProfile } from "./profile.js";

export interface YouganAgentState {
  workId?: string;
  profile: WorkProfile;
  brief: WorkBrief;
  outline: WorkOutline;
  /** 创作总监计划，仅 Agent 内部使用 */
  plan: WorkProductionPlan;
  draft: WorkDraft | null;
  turnTaskQueue?: TurnTaskKind[];
  activeTurnTask?: TurnTaskKind | null;
  completedTurnTasks?: TurnTaskKind[];
  openingBriefSuggestions: BriefSuggestions | null;
  briefSuggestions: BriefSuggestions | null;
}

/** 推送到前端的 stream 字段（不含内部 plan） */
export type YouganStreamValues = Partial<
  Pick<
    YouganAgentState,
    | "workId"
    | "profile"
    | "brief"
    | "outline"
    | "draft"
    | "turnTaskQueue"
    | "activeTurnTask"
    | "completedTurnTasks"
    | "openingBriefSuggestions"
    | "briefSuggestions"
  >
>;
