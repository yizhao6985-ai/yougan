/**
 * 灵感模式回合结束后，用结构化输出生成可点击建议。
 */
import { HumanMessage } from "@langchain/core/messages";

import { createStructuredModel } from "../../../../llm/dashscope.js";
import { invokeStructuredOutput } from "../../../../lib/structured-output.js";
import {
  DEFAULT_INSPIRATION_SUGGESTIONS_HINT,
  newInspirationSuggestion,
  type InspirationSuggestions,
  type WorkInspiration,
  type WorkProfile,
} from "../../../../schema.js";
import { inspirationSummary, profileSummary } from "../../../../prompt/context.js";
import {
  InspirationSuggestionsResponseSchema,
  INSPIRATION_SUGGESTIONS_COUNT,
} from "./schema.js";
import type { AgentStateType } from "../../../../state.js";
import { parseInspiration, parseProfile } from "../../../../lib/parse-agent-state.js";
import { messageContentToText } from "../../../../lib/message-content.js";

function buildSuggestionsPrompt(
  profile: WorkProfile,
  inspiration: WorkInspiration,
  lastAssistantReply: string,
  lastUserMessage: string,
): string {
  return `你是「有感 Yougan」灵感顾问，在灵感模式对话回合结束后，为客户生成下一步可点击建议。

已确认需求：
${inspirationSummary(inspiration)}

作品特征：
${profileSummary(profile)}

客户上一条消息：
${lastUserMessage || "（无）"}

你刚回复的内容：
${lastAssistantReply || "（无）"}

请生成 ${INSPIRATION_SUGGESTIONS_COUNT} 条建议，帮助客户：
1. 继续补充或澄清创作需求（explore）
2. 确认某条已讨论的灵感要点（confirm）
3. 在需求足够时引导进入提问模式或创作模式（navigate，如「切换到提问模式，问问怎么把这个选题写得更好」）

要求：
- label 简短（≤8 字），message 是用户点击后直接发送的完整口语化中文
- 每条建议互斥、可执行，不要重复
- 若需求尚不明确，以 explore 为主；若已较完整，可含 navigate
- 不要生成需要 Agent 才能执行的操作描述`;
}

function fallbackSuggestions(
  inspiration: WorkInspiration,
): InspirationSuggestions {
  const hasRequirements = inspiration.confirmed_requirements.length > 0;
  const suggestions = hasRequirements
    ? [
        newInspirationSuggestion(
          "confirm",
          "补充受众",
          "还想再明确一下目标受众是谁",
        ),
        newInspirationSuggestion(
          "explore",
          "补充风格",
          "帮我想想适合什么语气和风格",
        ),
        newInspirationSuggestion(
          "navigate",
          "去提问",
          "切换到提问模式，我想问问怎么把这个方向做得更好",
        ),
        newInspirationSuggestion(
          "navigate",
          "开始创作",
          "需求差不多了，切换到创作模式开始制作",
        ),
      ]
    : [
        newInspirationSuggestion(
          "explore",
          "定平台",
          "还没想好发哪个平台，帮我分析一下",
        ),
        newInspirationSuggestion(
          "explore",
          "定选题",
          "有一个大概方向，帮我细化选题",
        ),
        newInspirationSuggestion(
          "explore",
          "定受众",
          "想先明确一下目标读者是谁",
        ),
        newInspirationSuggestion(
          "confirm",
          "记录灵感",
          "把我刚才说的整理成一条已确认需求",
        ),
      ];

  return {
    hint: DEFAULT_INSPIRATION_SUGGESTIONS_HINT,
    suggestions,
  };
}

function extractLastMessages(state: AgentStateType): {
  lastAssistant: string;
  lastUser: string;
} {
  const messages = state.messages ?? [];
  let lastAssistant = "";
  let lastUser = "";
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const type = msg._getType?.() ?? msg.type;
    const text = messageContentToText(msg.content);
    if (!lastAssistant && type === "ai" && text.trim()) {
      lastAssistant = text;
    }
    if (!lastUser && type === "human" && text.trim()) {
      lastUser = text;
    }
    if (lastAssistant && lastUser) break;
  }
  return { lastAssistant, lastUser };
}

export async function generateInspirationSuggestions(
  state: AgentStateType,
): Promise<InspirationSuggestions | null> {
  const profile = parseProfile(state);
  const inspiration = parseInspiration(state);
  const { lastAssistant, lastUser } = extractLastMessages(state);

  if (!lastAssistant.trim()) {
    return null;
  }

  const llm = createStructuredModel({ temperature: 0.6 });
  const prompt = buildSuggestionsPrompt(
    profile,
    inspiration,
    lastAssistant,
    lastUser,
  );

  try {
    const parsed = await invokeStructuredOutput(
      llm,
      InspirationSuggestionsResponseSchema,
      [new HumanMessage(prompt)],
      { name: "inspiration_suggestions" },
    );
    return {
      hint: parsed.hint?.trim() || DEFAULT_INSPIRATION_SUGGESTIONS_HINT,
      suggestions: parsed.suggestions.map((s) =>
        newInspirationSuggestion(s.kind, s.label, s.message),
      ),
    };
  } catch {
    return fallbackSuggestions(inspiration);
  }
}
