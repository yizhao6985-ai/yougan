import { previewHasContent, type TurnQueueKind } from "@yougan/domain";

import { getLatestHumanMessagePreviewSelections } from "#agent/messages/human.js";
import { getPreview } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

import { sortTurnQueue } from "./sort-turn-queue.js";

/** 有成稿划词引用 + 修改说明时确定性入队 collectRevision，跳过 planner LLM。 */
export function tryResolvePreviewSelectionQueue(
  state: AgentStateType,
  userMessage: string,
): TurnQueueKind[] | null {
  if (!userMessage.trim()) return null;
  if (getLatestHumanMessagePreviewSelections(state.messages).length === 0) {
    return null;
  }
  if (!previewHasContent(getPreview(state))) return null;
  return sortTurnQueue(["collectRevision"]);
}
