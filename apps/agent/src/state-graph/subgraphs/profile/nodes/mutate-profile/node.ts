/** 按用户意图修改作品方案：bind 原子工具并流式决策 */
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
import { getLatestHumanMessageText } from "#agent/messages/human.js";
import { prepareChatMessagesForLlm } from "#agent/messages/llm-input.js";
import { finalizeRunningProfileActivities } from "#agent/state-io/finalize-profile-activities.js";
import { patchRunProgress } from "#agent/state-io/run-progress.js";
import {
  createTurnActivityMessage,
  profileToolActivityId,
  profileToolSubject,
} from "#agent/state-io/turn-activities.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { rethrowUnlessRecoverable } from "../../../../helpers/recoverable-node-error.js";
import { buildMutateProfilePrompt } from "./prompt.js";
import { PROFILE_TOOLS } from "../run-profile-tools/tools/index.js";
import {
  isProfileToolActivityName,
  resolveProfileToolName,
} from "#agent/state-io/profile-tool-registry.js";

const llmWithTools = createChatModel({
  temperature: env.llmTemperature,
}).bindTools(PROFILE_TOOLS);

export async function mutateProfileNode(
  state: AgentStateType,
  config: RunnableConfig,
): Promise<AgentStatePatch> {
  const userMessage = getLatestHumanMessageText(state.messages).trim();
  if (!userMessage) return patchRunProgress("profile");

  const response = await streamChat(
    llmWithTools,
    [
      new SystemMessage(buildMutateProfilePrompt(state)),
      ...prepareChatMessagesForLlm(state),
    ],
    config,
  );

  const activityMessages = [];
  const hasToolCalls =
    AIMessage.isInstance(response) && (response.tool_calls?.length ?? 0) > 0;
  if (hasToolCalls) {
    const seenActivityIds = new Set<string>();
    for (const call of response.tool_calls ?? []) {
      const toolName = call.name?.trim();
      if (!toolName || !isProfileToolActivityName(toolName)) continue;
      const resolved = resolveProfileToolName(toolName)!;
      const activityId = profileToolActivityId(resolved);
      if (seenActivityIds.has(activityId)) continue;
      seenActivityIds.add(activityId);
      activityMessages.push(
        createTurnActivityMessage({
          id: activityId,
          refId: resolved,
          kind: "profile_update",
          status: "running",
          subject: profileToolSubject(resolved),
        }),
      );
    }
  }

  const finalizedActivities = hasToolCalls
    ? []
    : finalizeRunningProfileActivities(state.messages);

  return {
    ...patchRunProgress("profile"),
    messages: [...activityMessages, ...finalizedActivities, response],
    ...patchAiUsageMetering(state.aiUsage, config),
  };
}

/** 超时/可恢复失败：收尾 running activity + 可见回复，结束 profile 环 */
export function mutateProfileErrorHandler(
  state: AgentStateType,
  error: NodeError,
): AgentStatePatch {
  rethrowUnlessRecoverable(error);
  const content = isNodeTimeoutError(error.error)
    ? LLM_TIMEOUT_FAILURE_MESSAGE
    : LLM_FAILURE_MESSAGE;
  return {
    ...patchRunProgress("profile"),
    messages: [
      ...finalizeRunningProfileActivities(state.messages),
      new AIMessage(content),
    ],
  };
}
