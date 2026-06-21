import { AIMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import { previewPlainText, previewHasContent } from "@yougan/domain";
import { getPreview } from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";
import {
  buildRunProgress,
  emitRunProgress,
  patchRunProgress,
} from "#agent/state-io/run-progress.js";

export async function summarizeRevisionNode(
  state: AgentStateType,
  config?: RunnableConfig,
): Promise<AgentStatePatch> {
  const progress = buildRunProgress("revise_summarize", "改稿完成");
  emitRunProgress(progress, config);

  const preview = getPreview(state);
  const excerpt = previewHasContent(preview)
    ? previewPlainText(preview, 800)
    : "（以配图/音视频为主）";

  const content = `改稿好了，主要变动在上面这段里。\n\n${excerpt}\n\n---\n完整成稿在右侧「作品」面板，可以再通读一遍。`;

  return {
    messages: [new AIMessage(content)],
    ...patchRunProgress(progress),
  };
}
