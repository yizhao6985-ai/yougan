import { AIMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import { clearRevisionItems, previewPlainText, previewHasContent } from "@yougan/domain";
import {
  getPreview,
  getRevision,
  patchPendingRevision,
} from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

/** 改稿成功：清空 open revision items 并回复感友 */
export async function finalizeRevisionNode(
  state: AgentStateType,
  _config?: RunnableConfig,
): Promise<AgentStatePatch> {
  const revision = getRevision(state);
  const preview = getPreview(state);
  const excerpt = previewHasContent(preview)
    ? previewPlainText(preview, 800)
    : "（以配图/音视频为主）";

  const content = `改稿好了，主要变动在上面这段里。\n\n${excerpt}\n\n---\n完整成稿在右侧「作品」面板，可以再通读一遍。`;

  return {
    ...patchPendingRevision(state, clearRevisionItems(revision)),
    messages: [new AIMessage(content)],
  };
}
