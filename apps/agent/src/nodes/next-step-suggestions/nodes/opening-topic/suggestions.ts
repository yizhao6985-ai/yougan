/**
 * 空 thread：按作品标题生成开屏选题建议。
 */
import { HumanMessage } from "@langchain/core/messages";

import { createStructuredModel } from "#agent/llm/dashscope.js";
import { invokeStructuredOutput } from "#agent/lib/structured-output.js";
import { parseBlueprint, parseProfile } from "#agent/lib/parse-agent-state.js";
import { newBriefSuggestion, type BriefSuggestions } from "#agent/schema.js";
import type { AgentStateType } from "#agent/state.js";
import { buildOpeningTopicSuggestionsPrompt } from "./prompt.js";
import { OpeningTopicSuggestionsResponseSchema } from "../shared/schema.js";
import { sanitizeNextStepSuggestions } from "../shared/sanitize-suggestions.js";

const OPENING_HINT = "";

function audienceClause(audience: string | null | undefined): string {
  const a = audience?.trim();
  return a ? `，主要面向${a}` : "";
}

function fallbackOpeningTopicSuggestions(
  state: AgentStateType,
): BriefSuggestions {
  const topic = state.workTitle?.trim() || "这个主题";
  const forAudience = audienceClause(parseProfile(state).audience);

  return {
    hint: OPENING_HINT,
    suggestions: sanitizeNextStepSuggestions([
      newBriefSuggestion(
        "explore",
        "新手入门帖",
        `我想写一篇「${topic}」的新手入门选题，给一个具体标题角度${forAudience}`,
      ),
      newBriefSuggestion(
        "explore",
        "踩坑避坑",
        `我想写「${topic}」里最容易踩的 3 个坑和解决办法${forAudience}`,
      ),
      newBriefSuggestion(
        "explore",
        "对比二选一",
        `我想做一篇「${topic}」的 A/B 对比选题（两种做法或两条路径）${forAudience}`,
      ),
      newBriefSuggestion(
        "explore",
        "真实案例",
        `我想用真实案例讲透「${topic}」里的一个转折点${forAudience}`,
      ),
      newBriefSuggestion(
        "explore",
        "工具清单",
        `我想做「${topic}」相关的工具/步骤清单，帮读者直接照着做${forAudience}`,
      ),
      newBriefSuggestion(
        "explore",
        "趋势变化",
        `我想写「${topic}」最近 1 个明显变化，以及普通人该怎么应对${forAudience}`,
      ),
      newBriefSuggestion(
        "explore",
        "反常识观点",
        `我想写一篇挑战常识的「${topic}」观点稿，标题要能引发讨论${forAudience}`,
      ),
    ]),
  };
}

function fallbackOpeningTopicSuggestionsWithBlueprint(
  state: AgentStateType,
): BriefSuggestions {
  const blueprint = parseBlueprint(state);
  const profile = parseProfile(state);
  const workTitle = state.workTitle?.trim() || "未命名作品";
  const forAudience = audienceClause(
    blueprint.voice.audience ?? profile.audience,
  );
  const lead =
    blueprint.premise.trim() ||
    blueprint.constraints[0]?.description?.trim() ||
    blueprint.beats[0]?.description?.trim();

  return {
    hint: OPENING_HINT,
    suggestions: sanitizeNextStepSuggestions([
      newBriefSuggestion(
        "explore",
        "深化子题",
        lead
          ? `在「${workTitle}」下，我想把「${lead}」深化成一个能直接开写的具体选题${forAudience}`
          : `在「${workTitle}」下我想深化一个能直接开写的子选题${forAudience}`,
      ),
      newBriefSuggestion(
        "explore",
        "相邻切口",
        `我想换一个相邻切口写「${workTitle}」，和现有方案相关但不重复${forAudience}`,
      ),
      newBriefSuggestion(
        "explore",
        "踩坑清单",
        `我想写「${workTitle}」读者最容易踩的 3 个坑${forAudience}`,
      ),
      newBriefSuggestion(
        "explore",
        "案例拆解",
        `我想用一个具体案例拆解「${workTitle}」的关键一步${forAudience}`,
      ),
      newBriefSuggestion(
        "explore",
        "对比选题",
        `我想做「${workTitle}」的对比型选题（两种方案/两条路径）${forAudience}`,
      ),
      newBriefSuggestion(
        "confirm",
        "对齐方案",
        `基于「${workTitle}」已有方案，帮我把下一个要写的具体选题定下来${forAudience}`,
      ),
      newBriefSuggestion(
        "navigate",
        "整理节拍",
        `「${workTitle}」选题差不多了，帮我把内容结构整理成可写的节拍`,
      ),
    ]),
  };
}

export async function generateOpeningTopicSuggestions(
  state: AgentStateType,
): Promise<BriefSuggestions> {
  const blueprint = parseBlueprint(state);
  const llm = createStructuredModel({ temperature: 0.55 });
  const prompt = buildOpeningTopicSuggestionsPrompt(state);

  try {
    const parsed = await invokeStructuredOutput(
      llm,
      OpeningTopicSuggestionsResponseSchema,
      [new HumanMessage(prompt)],
      { name: "opening_topic_suggestions" },
    );
    return {
      hint: parsed.hint?.trim() || OPENING_HINT,
      suggestions: sanitizeNextStepSuggestions(
        parsed.suggestions.map((s) =>
          newBriefSuggestion(s.kind, s.label, s.message),
        ),
      ),
    };
  } catch {
    if (
      blueprint.beats.length > 0 ||
      blueprint.constraints.length > 0 ||
      blueprint.premise.trim()
    ) {
      return fallbackOpeningTopicSuggestionsWithBlueprint(state);
    }
    return fallbackOpeningTopicSuggestions(state);
  }
}
