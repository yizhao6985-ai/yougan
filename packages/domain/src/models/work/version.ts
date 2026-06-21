import type { WorkProfile } from "./profile.js";
import type { WorkProduction } from "./production.js";
import type { WorkPreview } from "./preview.js";
import type { WorkReference } from "./reference.js";

/** 版本快照内容（与 Agent state 顶层字段对齐） */
export interface WorkVersionSnapshot {
  profile: WorkProfile;
  references: WorkReference[];
  preview: WorkPreview | null;
  production: WorkProduction;
}
