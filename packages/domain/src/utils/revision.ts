import type {
  RevisionKind,
  UserRevisionPhase,
} from "../models/revision.js";

/** 制作执行产出作品预览时记入版本时间轴 */
const PREVIEW_REVISION_KINDS = new Set<RevisionKind>(["execution_complete"]);

export function isUserVisibleRevisionKind(kind: RevisionKind): boolean {
  return userRevisionPhase(kind) !== null;
}

export function userRevisionPhase(kind: RevisionKind): UserRevisionPhase | null {
  if (PREVIEW_REVISION_KINDS.has(kind)) return "preview";
  return null;
}
