import { AIMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import { openRevisionItems } from "@yougan/domain";
import { getRevision } from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

export async function summarizeCollectRevisionNode(
  state: AgentStateType,
  _config?: RunnableConfig,
): Promise<AgentStatePatch> {
  const count = openRevisionItems(getRevision(state)).length;
  const content =
    count > 0
      ? `已加入改稿清单（共 ${count} 条）。通读后在对话中发送「开始改稿」等指令即可统一改稿。`
      : "未能解析改稿意见，请具体说明要改哪里。";

  return { messages: [new AIMessage(content)] };
}
