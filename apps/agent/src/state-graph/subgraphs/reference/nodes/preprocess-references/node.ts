/** 参考素材预处理：检查未分析资源并 bind 预处理工具 */
import { SystemMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import { env } from "#agent/env.js";
import { streamChat } from "#agent/llm/invoke/index.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import { prepareChatMessagesForLlm } from "#agent/messages/llm-input.js";
import type { AgentStateType } from "#agent/state.js";

import { listUnprocessedReferenceJobs } from "./helpers/list-unprocessed-jobs.js";
import { buildPreprocessReferencesPrompt } from "./prompt.js";
import { PREPROCESS_REFERENCE_TOOLS } from "../run-preprocess-tools/tools/index.js";

const llmWithTools = createChatModel({
  temperature: env.llmTemperature,
}).bindTools(PREPROCESS_REFERENCE_TOOLS);

export async function preprocessReferencesNode(
  state: AgentStateType,
  config: RunnableConfig,
): Promise<Partial<AgentStateType>> {
  const jobs = listUnprocessedReferenceJobs(state);
  if (!jobs.length) return {};

  const response = await streamChat(
    llmWithTools,
    [
      new SystemMessage(buildPreprocessReferencesPrompt(state, jobs)),
      ...prepareChatMessagesForLlm(state),
    ],
    config,
  );
  return { messages: [response] };
}
