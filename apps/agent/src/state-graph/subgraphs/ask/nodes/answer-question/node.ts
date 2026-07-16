/** 提问答疑：bind ask 工具并流式回复 */
import { AIMessage, SystemMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";
import {
  isNodeTimeoutError,
  type NodeError,
} from "@langchain/langgraph";

import { env } from "#agent/env.js";
import { streamChat } from "#agent/llm/invoke/index.js";
import {
  LLM_FAILURE_MESSAGE,
  LLM_TIMEOUT_FAILURE_MESSAGE,
} from "#agent/llm/invoke/timeout.js";
import { patchAiUsageMetering } from "#agent/llm/invoke/metering.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import { prepareChatMessagesForLlm } from "#agent/messages/llm-input.js";
import { patchRunProgress } from "#agent/state-io/run-progress.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { rethrowUnlessRecoverable } from "../../../../helpers/recoverable-node-error.js";
import { ASK_TOOLS } from "../run-ask-tools/tools/index.js";
import { buildAnswerQuestionPrompt } from "./prompt.js";

const llmWithTools = createChatModel({
  temperature: env.llmTemperature,
}).bindTools(ASK_TOOLS);

export async function answerQuestionNode(
  state: AgentStateType,
  config: RunnableConfig,
): Promise<AgentStatePatch> {
  const response = await streamChat(
    llmWithTools,
    [new SystemMessage(buildAnswerQuestionPrompt(state)), ...prepareChatMessagesForLlm(state)],
    config,
  );
  return {
    ...patchRunProgress("ask"),
    messages: [response],
    ...patchAiUsageMetering(state.aiUsage, config),
  };
}

/** 超时/可恢复失败：写入可见回复并结束 ask 环（无 tool_calls） */
export function answerQuestionErrorHandler(
  state: AgentStateType,
  error: NodeError,
): AgentStatePatch {
  rethrowUnlessRecoverable(error);
  const content = isNodeTimeoutError(error.error)
    ? LLM_TIMEOUT_FAILURE_MESSAGE
    : LLM_FAILURE_MESSAGE;
  return {
    ...patchRunProgress("ask"),
    messages: [new AIMessage(content)],
  };
}
