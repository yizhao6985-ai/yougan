/** 对话流内用户可见的业务事件（写入 messages，非 tool） */
export type TurnActivityKind =
  | "profile_update"
  | "production_step"
  | "reference_update"
  | "collect_revision"
  | "revise_step";

export type TurnActivityStatus = "running" | "done" | "failed";

export type TurnActivity = {
  id: string;
  kind: TurnActivityKind;
  status: TurnActivityStatus;
  /** 用户可见主文案，如「正在更新：方向」 */
  label: string;
  detail?: string | null;
  refId?: string | null;
  createdAt: number;
  updatedAt?: number;
};

export type TurnActivityInput = {
  /** 稳定 id，同 id upsert 覆盖（如 production-task-{taskId}） */
  id: string;
  kind: TurnActivityKind;
  status: TurnActivityStatus;
  /** 与 status 组合成 label；也可传 label 覆盖 */
  subject: string;
  label?: string;
  detail?: string | null;
  refId?: string | null;
  createdAt?: number;
  updatedAt?: number;
};

export const TURN_ACTIVITY_MESSAGE_KIND = "turn_activity" as const;

export function turnActivityLabel(
  status: TurnActivityStatus,
  subject: string,
): string {
  const target = subject.trim() || "内容";
  switch (status) {
    case "running":
      return `正在更新：${target}`;
    case "done":
      return `已经更新：${target}`;
    case "failed":
      return `未能更新：${target}`;
  }
}
