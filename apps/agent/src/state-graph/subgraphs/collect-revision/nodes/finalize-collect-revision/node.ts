import { AIMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import { openRevisionItems } from "@yougan/domain";
import { getRevision } from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

export async function finalizeCollectRevisionNode(
  state: AgentStateType,
  _config?: RunnableConfig,
): Promise<AgentStatePatch> {
  const count = openRevisionItems(getRevision(state)).length;
  const content =
    count > 0
      ? `这条已记进改稿清单，目前共 ${count} 条。你看一遍清单，没问题的话发「开始改稿」，我按清单统一改。`
      : "没能抓准要改哪里——可以说具体一点，比如改标题、哪一段的语气，或者直接在成稿里划词选中再说明。";

  return { messages: [new AIMessage(content)] };
}
