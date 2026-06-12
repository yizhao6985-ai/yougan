import type { WorkProduction } from "../work/production.js";
import type { WorkProfile } from "../work/profile.js";
import type { WorkReference } from "../work/reference.js";

/**
 * 单轮事务工作区。
 * 子图只写 turn.staging；commitTurn 一次性提交到 state 顶层 + Work 持久化。
 */
export interface TurnStaging {
  profile: WorkProfile;
  references: WorkReference[];
  production: WorkProduction;
}
