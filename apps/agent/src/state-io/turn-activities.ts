import { SystemMessage } from "@langchain/core/messages";
import {
  buildTurnActivityMessagePayload,
  deriveReferenceDelta,
  type TurnActivityInput,
  type WorkReference,
} from "@yougan/domain";

import type { AgentStatePatch } from "#agent/state.js";

export const REFERENCE_TURN_SUBJECT = "参考素材";
export const COLLECT_REVISION_SUBJECT = "改稿清单";
export const REVISE_TURN_SUBJECT = "成稿";

const PROFILE_TOOL_SUBJECTS: Record<string, string> = {
  update_profile_direction: "方向",
  update_profile_style: "风格",
  update_profile_setting: "背景",
  update_profile_background: "背景",
  update_profile_requirements: "需求",
  update_profile_bounds: "边界",
};

export function profileToolSubject(toolName: string): string {
  return PROFILE_TOOL_SUBJECTS[toolName] ?? "制作方案";
}

export function profileToolActivityId(toolName: string): string {
  return `profile-${toolName}`;
}

export function productionTaskActivityId(taskId: string): string {
  return `production-task-${taskId}`;
}

export function referenceTurnActivityId(humanMessageId: string): string {
  return `reference-turn-${humanMessageId}`;
}

export function collectRevisionActivityId(humanMessageId: string): string {
  return `collect-revision-${humanMessageId}`;
}

export function reviseTurnActivityId(humanMessageId: string): string {
  return `revise-turn-${humanMessageId}`;
}

export function buildReferenceTurnDetail(
  delta: ReturnType<typeof deriveReferenceDelta>,
): string | null {
  const parts: string[] = [];
  if (delta.added.length > 0) {
    parts.push(
      delta.added.length > 1
        ? `已分析 ${delta.added.length} 项`
        : `已分析 ${delta.added[0]?.asset.original_name?.trim() || "1 项"}`,
    );
  }
  if (delta.removed.length > 0) {
    parts.push(
      delta.removed.length > 1
        ? `已移除 ${delta.removed.length} 项`
        : "已移除 1 项",
    );
  }
  if (delta.toSummarize.length > 0 || delta.toPrompt.length > 0) {
    parts.push("已更新借鉴说明");
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function referenceTurnNeedsWork(
  committed: WorkReference[],
  staging: WorkReference[],
  userMessage: string,
): boolean {
  const delta = deriveReferenceDelta(committed, staging);
  return (
    delta.added.length > 0 ||
    delta.removed.length > 0 ||
    delta.toSummarize.length > 0 ||
    delta.toPrompt.length > 0 ||
    Boolean(userMessage.trim())
  );
}

export function createTurnActivityMessage(
  input: TurnActivityInput,
): SystemMessage {
  const payload = buildTurnActivityMessagePayload(input);
  return new SystemMessage({
    id: payload.id,
    content: payload.content,
    additional_kwargs: payload.additional_kwargs,
  });
}

export function upsertTurnActivity(input: TurnActivityInput): AgentStatePatch {
  return { messages: [createTurnActivityMessage(input)] };
}
