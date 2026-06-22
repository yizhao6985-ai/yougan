import type {
  TurnActivity,
  TurnActivityInput,
  TurnActivityStatus,
} from "../../models/agent/turn-activity.js";
import {
  TURN_ACTIVITY_MESSAGE_KIND,
  turnActivityLabel,
} from "../../models/agent/turn-activity.js";
import { sanitizeBriefingExcerpt } from "./turn-briefing-message.js";

export type TurnActivityMessagePayload = {
  yougan_message_kind: typeof TURN_ACTIVITY_MESSAGE_KIND;
  turn_activity: TurnActivity;
};

function newActivityId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `activity-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function parseActivityStatus(value: unknown): TurnActivityStatus {
  if (value === "running" || value === "done" || value === "failed") {
    return value;
  }
  return "done";
}

export function buildTurnActivity(input: TurnActivityInput): TurnActivity {
  const now = Date.now();
  const label =
    input.label?.trim() || turnActivityLabel(input.status, input.subject);
  const terminal = input.status === "done" || input.status === "failed";

  return {
    id: input.id,
    kind: input.kind,
    status: input.status,
    label,
    detail: sanitizeBriefingExcerpt(input.detail),
    refId: input.refId ?? null,
    createdAt: input.createdAt ?? now,
    updatedAt: terminal ? (input.updatedAt ?? now) : input.updatedAt,
  };
}

/** Agent：构造写入 messages 的 payload（SystemMessage additional_kwargs） */
export function buildTurnActivityMessagePayload(
  input: TurnActivityInput,
): { id: string; content: string; additional_kwargs: TurnActivityMessagePayload } {
  const activity = buildTurnActivity(input);
  return {
    id: `activity-${activity.id}`,
    content: activity.label,
    additional_kwargs: {
      yougan_message_kind: TURN_ACTIVITY_MESSAGE_KIND,
      turn_activity: activity,
    },
  };
}

type MessageLike = {
  id?: string;
  type?: string;
  additional_kwargs?: Record<string, unknown>;
};

export function isTurnActivityMessage(message: MessageLike): boolean {
  const kwargs = message.additional_kwargs;
  if (!kwargs || typeof kwargs !== "object") {
    return typeof message.id === "string" && message.id.startsWith("activity-");
  }
  return kwargs.yougan_message_kind === TURN_ACTIVITY_MESSAGE_KIND;
}

export function parseTurnActivityFromMessage(
  message: MessageLike,
): TurnActivity | null {
  if (!isTurnActivityMessage(message)) return null;
  const raw = message.additional_kwargs?.turn_activity;
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  if (typeof record.label !== "string" || typeof record.kind !== "string") {
    return null;
  }
  return {
    id: typeof record.id === "string" ? record.id : newActivityId(),
    kind: record.kind as TurnActivity["kind"],
    status: parseActivityStatus(record.status),
    label: record.label,
    detail: sanitizeBriefingExcerpt(record.detail),
    refId:
      typeof record.refId === "string"
        ? record.refId
        : record.refId == null
          ? null
          : null,
    createdAt:
      typeof record.createdAt === "number" ? record.createdAt : Date.now(),
    updatedAt:
      typeof record.updatedAt === "number" ? record.updatedAt : undefined,
  };
}
