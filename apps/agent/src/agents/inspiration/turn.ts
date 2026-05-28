/**
 * 灵感模式结构化输出结果映射。
 * 结构化生成由 createReactAgent.responseFormat 负责，不在 prompt 里要求 JSON。
 */
import {
  AIMessage,
  RemoveMessage,
  SystemMessage,
  isAIMessage,
} from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";

import {
  DEFAULT_INSPIRATION_CHOICES_HINT,
  type InspirationChoices,
  type WorkInspiration,
} from "../../schemas.js";
import {
  InspirationTurnSchema,
  type InspirationTurn,
} from "./schema.js";
import {
  parseInspiration,
  type AgentStateType,
} from "./state.js";

export const INSPIRATION_STRUCTURED_PROMPT_MESSAGE_ID =
  "inspiration-structured-prompt";

function buildFallbackTurn(input: {
  inspiration: WorkInspiration;
}): InspirationTurn {
  if (input.inspiration.confirmed_requirements.length > 0) {
    return {
      message: `目前已确认 ${input.inspiration.confirmed_requirements.length} 条灵感。还有想补充或调整的吗？确认后可以切换到大纲模式撰写创作大纲。`,
      show_choices: false,
    };
  }

  return {
    message: "好的，先确定发布平台和创作方向，你更倾向哪一个？",
    show_choices: true,
    choices: {
      options: [
        {
          description:
            "我想在小红书发布，偏经验分享与生活记录，先帮我定主题和受众",
        },
        {
          description:
            "我想在微博发布，偏短平快的观点输出，先帮我定角度和语气",
        },
        {
          description:
            "我想在微信公众号发布，偏深度长文，先帮我定结构和核心观点",
        },
        {
          description:
            "我想在抖音或快手发布，偏短视频脚本，先帮我定开头钩子",
        },
      ],
    },
  };
}

function toChoicesPayload(turn: InspirationTurn): InspirationChoices | null {
  if (!turn.show_choices || !turn.choices?.options?.length) return null;

  return {
    hint: turn.choices.hint?.trim() || DEFAULT_INSPIRATION_CHOICES_HINT,
    options: turn.choices.options.map((option) => ({
      description: option.description.trim(),
    })),
  };
}

function resolveInspirationTurn(state: AgentStateType): InspirationTurn {
  try {
    if (state.structuredResponse) {
      return InspirationTurnSchema.parse(state.structuredResponse);
    }
  } catch {
    // fall through to fallback
  }

  return buildFallbackTurn({ inspiration: parseInspiration(state) });
}

function isInternalStructuredPromptMessage(message: BaseMessage): boolean {
  if (message.id === INSPIRATION_STRUCTURED_PROMPT_MESSAGE_ID) return true;
  if (!SystemMessage.isInstance(message)) return false;
  const content =
    typeof message.content === "string" ? message.content.trim() : "";
  return content.startsWith("你是 Yougan 灵感模式助手");
}

function isEmptyStructuredAiStub(message: BaseMessage): boolean {
  if (!isAIMessage(message)) return false;
  if (message.tool_calls?.length) return false;
  const content =
    typeof message.content === "string" ? message.content.trim() : "";
  return content.length === 0;
}

/** 将 responseFormat 结果映射为用户可见 message 与 inspirationChoices */
export function applyInspirationStructuredOutput(
  state: AgentStateType,
): Partial<AgentStateType> {
  const turn = resolveInspirationTurn(state);
  const messageUpdates: BaseMessage[] = [];

  for (const message of state.messages ?? []) {
    if (!message.id) continue;
    if (
      isInternalStructuredPromptMessage(message) ||
      isEmptyStructuredAiStub(message)
    ) {
      messageUpdates.push(new RemoveMessage({ id: message.id }));
    }
  }

  messageUpdates.push(new AIMessage(turn.message.trim()));

  return {
    messages: messageUpdates,
    inspirationChoices: toChoicesPayload(turn),
    structuredResponse: undefined,
  };
}
