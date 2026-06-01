import type { RevisionKind } from "@/lib/types";

export const REVISION_KIND_LABELS: Record<RevisionKind, string> = {
  work_created: "创建作品",
  work_duplicated: "另存为新作品",
  work_restored: "回到历史版本",
  brief_requirement_added: "新增 brief 需求",
  brief_requirement_updated: "更新 brief 需求",
  brief_requirement_removed: "删除 brief 需求",
  brief_ready: "brief 定稿",
  profile_updated: "更新作品特征",
  plan_ready: "制作计划定稿",
  plan_revised: "更新制作计划",
  execution_complete: "完成制作执行",
};

export function revisionKindLabel(kind: RevisionKind): string {
  return REVISION_KIND_LABELS[kind] ?? kind;
}

export function formatRevisionTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
