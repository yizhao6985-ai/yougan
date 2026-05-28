/** 灵感模式 ReAct Agent：MiniMax 工具轮 + responseFormat 结构化对话 */
import {
  AIMessage,
  isAIMessage,
  isToolMessage,
  RemoveMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

import { createChatModel } from "../../llm/minimax.js";
import { env } from "../../env.js";
import {
  AgentState,
  parseInspiration,
  parseProfile,
  type AgentStateType,
} from "./state.js";
import {
  buildInspirationActionPrompt,
  buildInspirationStructuredPrompt,
} from "./prompts.js";
import { INSPIRATION_TOOLS } from "./tools.js";
import { InspirationTurnSchema } from "./schema.js";
import { INSPIRATION_STRUCTURED_PROMPT_MESSAGE_ID } from "./turn.js";

function hasPendingToolCalls(messages: AgentStateType["messages"]): boolean {
  const toolMessageIds = new Set(
    messages.filter(isToolMessage).map((message) => message.tool_call_id),
  );

  let lastAiMessage: AIMessage | undefined;
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (isAIMessage(message)) {
      lastAiMessage = message;
      break;
    }
  }

  return (
    lastAiMessage?.tool_calls?.some(
      (call) => call.id == null || !toolMessageIds.has(call.id),
    ) ?? false
  );
}

/** 工具轮结束后注入结构化 prompt，供 responseFormat 节点使用 */
function prepareStructuredResponseContext(state: AgentStateType) {
  const messages = [...(state.messages ?? [])];
  const lastMessage = messages.at(-1);

  if (hasPendingToolCalls(messages)) {
    return {};
  }

  if (lastMessage && isToolMessage(lastMessage)) {
    return {};
  }

  const nextMessages = [...messages];
  const lastAi = nextMessages.at(-1);
  if (lastAi && isAIMessage(lastAi) && !lastAi.tool_calls?.length) {
    nextMessages.pop();
  }

  const profile = parseProfile(state);
  const inspiration = parseInspiration(state);
  const structuredPrompt = buildInspirationStructuredPrompt({
    profile,
    inspiration,
  });

  const cleanup: RemoveMessage[] = [];
  for (const message of nextMessages) {
    if (message.id === INSPIRATION_STRUCTURED_PROMPT_MESSAGE_ID) {
      cleanup.push(new RemoveMessage({ id: message.id }));
    }
  }

  return {
    messages: [
      ...cleanup,
      new SystemMessage({
        id: INSPIRATION_STRUCTURED_PROMPT_MESSAGE_ID,
        content: structuredPrompt,
      }),
      ...nextMessages,
    ],
  };
}

export function createInspirationAgent(temperature: number) {
  return createReactAgent({
    llm: createChatModel({ temperature }),
    tools: INSPIRATION_TOOLS,
    stateSchema: AgentState,
    prompt: (state) => {
      const typed = state as AgentStateType;
      const system = buildInspirationActionPrompt(typed);
      return [new SystemMessage(system), ...(typed.messages ?? [])];
    },
    postModelHook: prepareStructuredResponseContext,
    responseFormat: {
      schema: InspirationTurnSchema,
      name: "inspiration_turn",
    },
  });
}

/** @deprecated 使用 getInspirationAgent(temperature) */
export const inspirationAgent = createInspirationAgent(env.minimaxTemperature);
