import type { WorkBrief } from "./brief.js";
import type { BriefSuggestions } from "./suggestions.js";
import type { WorkDraft } from "./draft.js";
import type { ChatMode } from "./modes.js";
import type { WorkProductionPlan } from "./plan.js";
import type { WorkProfile } from "./profile.js";

export interface YouganAgentState {
  mode: ChatMode;
  workId?: string;
  profile: WorkProfile;
  brief: WorkBrief;
  plan: WorkProductionPlan;
  draft: WorkDraft | null;
  briefSuggestions: BriefSuggestions | null;
}

export type YouganStreamValues = Partial<
  Pick<
    YouganAgentState,
    | "mode"
    | "workId"
    | "profile"
    | "brief"
    | "plan"
    | "draft"
    | "briefSuggestions"
  >
>;
