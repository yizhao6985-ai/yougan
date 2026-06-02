/**
 * 新对话空 thread：按对话标题生成开场可点击建议。
 */
import { HumanMessage } from "@langchain/core/messages";

import { createStructuredModel } from "../../llm/dashscope.js";
import { invokeStructuredOutput } from "../../lib/structured-output.js";
import { parseBrief } from "../../lib/parse-agent-state.js";
import {
  DEFAULT_BRIEF_SUGGESTIONS_HINT,
  newBriefSuggestion,
  type BriefSuggestions,
} from "../../schema.js";
import type { AgentStateType } from "../../state.js";
import { buildOpeningSuggestionsPrompt } from "./opening-prompt.js";
import { ConversationRecommendationsResponseSchema } from "./schema.js";
import { dropGenericSupplementOptions } from "./sanitize-suggestions.js";

const OPENING_HINT = "点一条开始，或直接输入";

function fallbackOpeningSuggestions(): BriefSuggestions {
  return {
    hint: OPENING_HINT,
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
  };
}

export async function generateOpeningBriefSuggestions(
  state: AgentStateType,
): Promise<BriefSuggestions> {
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
      hint: parsed.hint?.trim() || OPENING_HINT || DEFAULT_BRIEF_SUGGESTIONS_HINT,
      suggestions: dropGenericSupplementOptions(
        parsed.suggestions.map((s) =>
          newBriefSuggestion(s.kind, s.label, s.message),
        ),
      ),
    };
  } catch {
    if (brief.requirements.length > 0) {
      return {
        hint: OPENING_HINT,
        suggestions: [
          newBriefSuggestion(
            "confirm",
            "补充需求",
            "基于已有 brief，我还想再明确几个细节",
          ),
          newBriefSuggestion(
            "explore",
            "深入方案",
            "我更倾向刚才提到的方向，想再展开聊聊",
          ),
          newBriefSuggestion(
            "navigate",
            "整理结构",
            "方向差不多了，帮我整理一下内容结构",
          ),
        ],
      };
    }
    return fallbackOpeningSuggestions();
  }
}
