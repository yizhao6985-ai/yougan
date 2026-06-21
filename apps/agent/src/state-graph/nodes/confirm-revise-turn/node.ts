/** 进入 revise 子图前：interrupt 等待用户确认（将出新成稿） */
import { interrupt } from "@langchain/langgraph";
import {
  REVISE_CONFIRM_INTERRUPT_KIND,
  openRevisionItems,
  type ReviseConfirmDecision,
  type ReviseConfirmInterruptValue,
} from "@yougan/domain";

import {
  getActiveTurnKind,
  getRevision,
  getTurnQueue,
  patchTurn,
} from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

function buildReviseConfirmPayload(state: AgentStateType): ReviseConfirmInterruptValue {
  const items = openRevisionItems(getRevision(state));
  const lines = items
    .slice(0, 8)
    .map((item, index) => {
      const anchor = item.anchor?.quote?.trim();
      return `${index + 1}. ${anchor ? `「${anchor}」→ ` : ""}${item.instruction}`;
    })
    .join("\n");

  return {
    kind: REVISE_CONFIRM_INTERRUPT_KIND,
    title: "按清单改一版",
    message:
      items.length > 0
        ? `即将按以下 ${items.length} 条改稿意见更新作品（通常 1～2 分钟）：\n\n${lines}`
        : "即将按当前改稿清单更新作品。确认开始吗？",
    itemCount: items.length,
  };
}

export async function confirmReviseTurnNode(
  state: AgentStateType,
): Promise<AgentStatePatch> {
  const isReviseConfirm =
    getActiveTurnKind(state) === "revise" || getTurnQueue(state)[0] === "revise";
  if (!isReviseConfirm) return {};

  const decision = interrupt<
    ReviseConfirmInterruptValue,
    ReviseConfirmDecision
  >(buildReviseConfirmPayload(state));

  return patchTurn(state, { reviseConfirm: decision });
}
