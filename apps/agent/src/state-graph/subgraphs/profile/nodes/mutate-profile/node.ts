/** 按用户意图修改作品方案：bind 原子工具并流式决策 */
import { AIMessage, SystemMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import { env } from "#agent/env.js";
import { streamChat } from "#agent/llm/invoke/index.js";
import { patchAiUsageMetering } from "#agent/llm/invoke/metering.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import { getLatestHumanMessageText } from "#agent/messages/human.js";
import { prepareChatMessagesForLlm } from "#agent/messages/llm-input.js";
import { finalizeRunningProfileActivities } from "#agent/state-io/finalize-profile-activities.js";
import {
  createTurnActivityMessage,
  profileToolActivityId,
  profileToolSubject,
} from "#agent/state-io/turn-activities.js";
import type { AgentStateType } from "#agent/state.js";

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
): Promise<Partial<AgentStateType>> {
  const userMessage = getLatestHumanMessageText(state.messages).trim();
  if (!userMessage) return {};

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
    messages: [...activityMessages, ...finalizedActivities, response],
    ...patchAiUsageMetering(state.aiUsage, config),
  };
}
