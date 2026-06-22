import type { BaseMessage } from "@langchain/core/messages";
import { ToolMessage } from "@langchain/core/messages";
import {
  isTurnActivityMessage,
  parseTurnActivityFromMessage,
  type TurnActivityStatus,
} from "@yougan/domain";

import {
  createTurnActivityMessage,
  profileToolSubject,
} from "./turn-activities.js";
import { resolveProfileToolName } from "./profile-tool-registry.js";

const STATUS_RANK: Record<TurnActivityStatus, number> = {
  running: 0,
  failed: 1,
  done: 2,
};

function toolOutcomeForRef(
  messages: BaseMessage[],
  refId: string,
): "success" | "error" | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (!ToolMessage.isInstance(message)) continue;
    if (message.name !== refId) continue;
    return message.status === "error" ? "error" : "success";
  }
  return null;
}

/** 将仍停留在 running 的 profile_update activity 收束为 done / failed */
export function finalizeRunningProfileActivities(messages: BaseMessage[]) {
  const latest = new Map<
    string,
    {
      status: TurnActivityStatus;
      refId: string | null;
      createdAt: number;
    }
  >();

  for (const message of messages) {
    if (!isTurnActivityMessage(message)) continue;
    const activity = parseTurnActivityFromMessage(message);
    if (!activity || activity.kind !== "profile_update") continue;

    const prev = latest.get(activity.id);
    if (
      !prev ||
      STATUS_RANK[activity.status] >= STATUS_RANK[prev.status]
    ) {
      latest.set(activity.id, {
        status: activity.status,
        refId: activity.refId ?? null,
        createdAt: activity.createdAt,
      });
    }
  }

  const outputs = [];
  for (const [id, info] of latest) {
    if (info.status !== "running") continue;

    const canonicalRef = info.refId ? resolveProfileToolName(info.refId) : null;
    const subject = canonicalRef
      ? profileToolSubject(canonicalRef)
      : info.refId
        ? profileToolSubject(info.refId)
        : "制作方案";
    const toolOutcome = canonicalRef
      ? toolOutcomeForRef(messages, canonicalRef)
      : null;
    const status: TurnActivityStatus =
      !canonicalRef || toolOutcome === "error" || toolOutcome === null
        ? "failed"
        : "done";

    outputs.push(
      createTurnActivityMessage({
        id,
        refId: canonicalRef ?? info.refId,
        kind: "profile_update",
        status,
        subject,
        createdAt: info.createdAt,
      }),
    );
  }

  return outputs;
}
