/** 执行 profile 子图 tool_calls（归一化误用工具名后交给 ToolNode），并收束 activity */
import { AIMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";

import { hasPendingAiToolCalls } from "#agent/messages/pending-tool-calls.js";
import { finalizeRunningProfileActivities } from "#agent/state-io/finalize-profile-activities.js";
import { resolveProfileToolName } from "#agent/state-io/profile-tool-registry.js";
import type { AgentStateType } from "#agent/state.js";

import { PROFILE_TOOLS } from "./tools/index.js";

const toolNode = new ToolNode(PROFILE_TOOLS);

function remapPendingProfileToolCalls(
  messages: AgentStateType["messages"],
): AgentStateType["messages"] {
  if (!hasPendingAiToolCalls(messages)) return messages;

  let remapped = false;
  const next = [...messages];

  for (let i = next.length - 1; i >= 0; i -= 1) {
    const message = next[i];
    if (!AIMessage.isInstance(message) || !message.tool_calls?.length) continue;

    const toolCalls = message.tool_calls.map((call) => {
      const rawName = call.name?.trim() ?? "";
      const resolved = resolveProfileToolName(rawName);
      if (!resolved || resolved === rawName) return call;
      remapped = true;
      return { ...call, name: resolved };
    });

    next[i] = new AIMessage({
      id: message.id,
      content: message.content,
      tool_calls: toolCalls,
      invalid_tool_calls: message.invalid_tool_calls,
      additional_kwargs: message.additional_kwargs,
      response_metadata: message.response_metadata,
      usage_metadata: message.usage_metadata,
    });
    break;
  }

  return remapped ? next : messages;
}

export async function runProfileToolsNode(
  state: AgentStateType,
  config: Parameters<ToolNode["invoke"]>[1],
) {
  const messages = remapPendingProfileToolCalls(state.messages);
  const invokeState =
    messages === state.messages ? state : { ...state, messages };
  const result = await toolNode.invoke(invokeState, config);
  const toolMessages = Array.isArray(result?.messages)
    ? result.messages
    : result?.messages
      ? [result.messages]
      : [];
  const finalized = finalizeRunningProfileActivities([
    ...invokeState.messages,
    ...toolMessages,
  ]);

  return {
    ...result,
    messages: [...toolMessages, ...finalized],
  };
}
