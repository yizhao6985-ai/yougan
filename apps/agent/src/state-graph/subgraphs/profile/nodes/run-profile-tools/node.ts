/** 执行 profile 子图 tool_calls（归一化误用工具名后交给 ToolNode），并收束 activity */
import {
  AIMessage,
  isBaseMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { Command, isCommand } from "@langchain/langgraph";
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

/** ToolNode 在 tool 返回 Command 时会产出 Command[]，需从中抽出 messages */
function collectMessagesFromToolNodeResult(result: unknown): BaseMessage[] {
  if (result == null) return [];

  if (Array.isArray(result)) {
    const messages: BaseMessage[] = [];
    for (const item of result) {
      if (isCommand(item)) {
        const update = item.update as { messages?: BaseMessage | BaseMessage[] };
        const nested = update?.messages;
        if (!nested) continue;
        messages.push(...(Array.isArray(nested) ? nested : [nested]));
        continue;
      }
      if (isBaseMessage(item)) {
        messages.push(item);
      }
    }
    return messages;
  }

  if (typeof result === "object" && "messages" in result) {
    const nested = (result as { messages?: BaseMessage | BaseMessage[] }).messages;
    if (!nested) return [];
    return Array.isArray(nested) ? nested : [nested];
  }

  return [];
}

export async function runProfileToolsNode(
  state: AgentStateType,
  config: Parameters<ToolNode["invoke"]>[1],
) {
  const messages = remapPendingProfileToolCalls(state.messages);
  const invokeState =
    messages === state.messages ? state : { ...state, messages };
  const result = await toolNode.invoke(invokeState, config);
  const toolMessages = collectMessagesFromToolNodeResult(result);
  const finalized = finalizeRunningProfileActivities([
    ...invokeState.messages,
    ...toolMessages,
  ]);

  // 无待收束 activity：原样返回，让图层正确应用 Command[]（含 staging.profile）
  if (finalized.length === 0) {
    return result;
  }

  // tool 已返回 Command 时不可展开成普通对象，否则会丢掉 profile 补丁
  if (Array.isArray(result) && result.some(isCommand)) {
    return [
      ...result,
      new Command({ update: { messages: finalized } }),
    ];
  }

  if (result && typeof result === "object" && !Array.isArray(result)) {
    const existing = collectMessagesFromToolNodeResult(result);
    return {
      ...result,
      messages: [...existing, ...finalized],
    };
  }

  return { messages: [...toolMessages, ...finalized] };
}
