import type {
  RevisionKind,
  UserRevisionPhase,
} from "../models/revision.js";

/** 创作执行产出作品预览（draft）时记入版本时间轴 */
const DRAFT_REVISION_KINDS = new Set<RevisionKind>(["execution_complete"]);

/** plan、灵感、大纲与操作类 revision 不对用户展示 */
export function isUserVisibleRevisionKind(kind: RevisionKind): boolean {
  return userRevisionPhase(kind) !== null;
}

export function userRevisionPhase(kind: RevisionKind): UserRevisionPhase | null {
  if (DRAFT_REVISION_KINDS.has(kind)) return "draft";
  return null;
}
