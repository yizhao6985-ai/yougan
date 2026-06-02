/**
 * 灵感模式回合结束后：根据灵感节点正文中的方案分析，生成对齐的可点击建议。
 */
import { HumanMessage } from "@langchain/core/messages";

import { createStructuredModel } from "../../llm/dashscope.js";
import { invokeStructuredOutput } from "../../lib/structured-output.js";
import {
  DEFAULT_BRIEF_SUGGESTIONS_HINT,
  newBriefSuggestion,
  type BriefSuggestions,
  type WorkBrief,
} from "../../schema.js";
import { briefSummary, profileSummary } from "../../prompt/context.js";
import { YOUGAN_USER_LABEL } from "../../prompt/persona.js";
import type { AgentStateType } from "../../state.js";
import { parseBrief, parseProfile } from "../../lib/parse-agent-state.js";
import { extractLastMessages } from "./extract-last-messages.js";
import {
  BriefSuggestionsResponseSchema,
  BRIEF_SUGGESTIONS_COUNT,
} from "./schema.js";
import { dropGenericSupplementOptions } from "./sanitize-suggestions.js";

function buildAfterInspirationSuggestionsPrompt(
  profile: ReturnType<typeof parseProfile>,
  brief: WorkBrief,
  lastAssistantReply: string,
  lastUserMessage: string,
): string {
  return `你是「有感 Yougan」灵感搭子。灵感模式回合已结束，请根据**上一条 AI 回复**（含若干可能性及其结果分析），生成 ${BRIEF_SUGGESTIONS_COUNT} 条可点击快捷建议。

当前 brief：
${briefSummary(brief)}

作品特征：
${profileSummary(profile)}

${YOUGAN_USER_LABEL}上一条消息：
${lastUserMessage || "（无）"}

灵感节点刚回复的全文（须以此为依据，勿编造未出现的方案）：
${lastAssistantReply}

生成要求：
1. **与正文方案对齐**：若正文列出「方案一/二/三」或 A/B/C 等可能性，优先为每条方案生成 1 条 explore（message 像用户选定该方向继续聊，可引用方案要点）
2. 可含 1 条 confirm（用户确认某条 brief 要点）或 navigate（brief 已较完整时引导定稿/切换创作），总数仍为 ${BRIEF_SUGGESTIONS_COUNT}
3. label 简短（≤8 字）；message 是用户点击后直接发送的完整口语化中文
4. 互斥、可执行；禁止客服腔；勿与正文分析矛盾
5. **禁止**生成「补充想法 / 我还有其他想法 / 自由发挥」类兜底选项——这类引导只写在 hint，由用户在输入框自行补充

hint 须提示：点选一条继续；若有其他想法，可在下方输入框补充。`;
}

function fallbackAfterInspirationSuggestions(brief: WorkBrief): BriefSuggestions {
  const hasRequirements = brief.requirements.length > 0;
  const suggestions = hasRequirements
    ? [
        newBriefSuggestion("explore", "选方案一", "我更想先沿着第一个方向往下聊"),
        newBriefSuggestion("confirm", "补充受众", "还想再明确一下目标受众是谁"),
        newBriefSuggestion(
          "navigate",
          "开始创作",
          "brief 差不多了，切换到创作模式开始制作",
        ),
        newBriefSuggestion("explore", "再对比", "帮我把这几个方向再对比一下"),
      ]
    : [
        newBriefSuggestion("explore", "选方案一", "先按第一个方向深入聊聊"),
        newBriefSuggestion("explore", "选方案二", "我对第二个方向更感兴趣"),
        newBriefSuggestion("explore", "定平台", "还没想好发哪个平台，结合方案再分析下"),
        newBriefSuggestion("explore", "再对比", "帮我把这几个方向的优劣再对比一下"),
      ];

  return {
    hint: DEFAULT_BRIEF_SUGGESTIONS_HINT,
    suggestions,
  };
}

export async function generateAfterInspirationBriefSuggestions(
  state: AgentStateType,
): Promise<BriefSuggestions | null> {
  const profile = parseProfile(state);
  const brief = parseBrief(state);
  const { lastAssistant, lastUser } = extractLastMessages(state);

  if (!lastAssistant.trim()) {
    return null;
  }

  const llm = createStructuredModel({ temperature: 0.6 });
  const prompt = buildAfterInspirationSuggestionsPrompt(
    profile,
    brief,
    lastAssistant,
    lastUser,
  );

  try {
    const parsed = await invokeStructuredOutput(
      llm,
      BriefSuggestionsResponseSchema,
      [new HumanMessage(prompt)],
      { name: "brief_suggestions" },
    );
    return {
      hint: parsed.hint?.trim() || DEFAULT_BRIEF_SUGGESTIONS_HINT,
      suggestions: dropGenericSupplementOptions(
        parsed.suggestions.map((s) =>
          newBriefSuggestion(s.kind, s.label, s.message),
        ),
      ),
    };
  } catch {
    return fallbackAfterInspirationSuggestions(brief);
  }
}
