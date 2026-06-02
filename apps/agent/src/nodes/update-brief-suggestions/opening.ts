/**
 * 新对话空 thread：按对话标题与模式生成开场可点击建议。
 */
import { HumanMessage } from "@langchain/core/messages";

import { createStructuredModel } from "../../llm/dashscope.js";
import { invokeStructuredOutput } from "../../lib/structured-output.js";
import { parseBrief, parseMode } from "../../lib/parse-agent-state.js";
import {
  DEFAULT_BRIEF_SUGGESTIONS_HINT,
  newBriefSuggestion,
  type BriefSuggestions,
  type ChatMode,
} from "../../schema.js";
import type { AgentStateType } from "../../state.js";
import { buildOpeningSuggestionsPrompt } from "./opening-prompt.js";
import { ConversationRecommendationsResponseSchema } from "./schema.js";
import { dropGenericSupplementOptions } from "./sanitize-suggestions.js";

const OPENING_HINT_BY_MODE: Record<ChatMode, string> = {
  inspiration: "点选一条开始探索；若有其他想法，可直接在下方输入框补充。",
  ask: "点选一个问题开始；也可在下方输入框自由提问。",
  creation: "点选一项开始创作；若有补充说明，可在下方输入框填写。",
};

function fallbackOpeningSuggestions(mode: ChatMode): BriefSuggestions {
  const byMode: Record<ChatMode, BriefSuggestions> = {
    inspiration: {
      hint: OPENING_HINT_BY_MODE.inspiration,
      suggestions: [
        newBriefSuggestion("explore", "聊方向", "我想围绕这个主题找几个创作方向"),
        newBriefSuggestion(
          "explore",
          "定受众",
          "帮我想想目标读者是谁、适合什么平台",
        ),
        newBriefSuggestion(
          "explore",
          "定选题",
          "有一个大概想法，帮我细化成具体选题",
        ),
      ],
    },
    ask: {
      hint: OPENING_HINT_BY_MODE.ask,
      suggestions: [
        newBriefSuggestion(
          "explore",
          "怎么写好",
          "怎么把这个选题写得更好、更有吸引力？",
        ),
        newBriefSuggestion(
          "explore",
          "结构参考",
          "这类内容一般是什么结构？有没有范例思路？",
        ),
        newBriefSuggestion(
          "explore",
          "行业背景",
          "这个赛道最近什么内容形式比较常见？",
        ),
      ],
    },
    creation: {
      hint: OPENING_HINT_BY_MODE.creation,
      suggestions: [
        newBriefSuggestion("explore", "生成成稿", "按当前制作计划生成一版成稿"),
        newBriefSuggestion(
          "explore",
          "制定计划",
          "还没有制作计划，帮 AI 团队先制定一版",
        ),
        newBriefSuggestion(
          "explore",
          "调整语气",
          "语气改得更口语、更适合目标平台",
        ),
      ],
    },
  };
  return byMode[mode];
}

export async function generateOpeningBriefSuggestions(
  state: AgentStateType,
): Promise<BriefSuggestions> {
  const mode = parseMode(state);
  const brief = parseBrief(state);
  const llm = createStructuredModel({ temperature: 0.6 });
  const prompt = buildOpeningSuggestionsPrompt(state);

  try {
    const parsed = await invokeStructuredOutput(
      llm,
      ConversationRecommendationsResponseSchema,
      [new HumanMessage(prompt)],
      { name: "conversation_recommendations" },
    );
    return {
      hint:
        parsed.hint?.trim() ||
        OPENING_HINT_BY_MODE[mode] ||
        DEFAULT_BRIEF_SUGGESTIONS_HINT,
      suggestions: dropGenericSupplementOptions(
        parsed.suggestions.map((s) =>
          newBriefSuggestion(s.kind, s.label, s.message),
        ),
      ),
    };
  } catch {
    const fallback = fallbackOpeningSuggestions(mode);
    if (brief.requirements.length > 0 && mode === "inspiration") {
      return {
        hint: fallback.hint,
        suggestions: [
          newBriefSuggestion(
            "confirm",
            "补充需求",
            "基于已有 brief，我还想再明确几个细节",
          ),
          newBriefSuggestion(
            "explore",
            "深入方案一",
            "我更倾向刚才提到的第一个方向，想再展开聊聊",
          ),
          newBriefSuggestion(
            "navigate",
            "开始制作",
            "方向差不多了，开始按计划制作吧",
          ),
        ],
      };
    }
    return fallback;
  }
}
