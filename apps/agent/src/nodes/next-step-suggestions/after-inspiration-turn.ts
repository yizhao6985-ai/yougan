/**
 * 灵感模式回合结束后：根据灵感节点正文生成下一步可点击建议。
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
  TurnNextStepSuggestionsResponseSchema,
  TURN_NEXT_STEP_SUGGESTIONS_COUNT,
} from "./schema.js";
import { MAX_NEXT_STEP_SUGGESTION_LENGTH } from "@yougan/domain";
import { sanitizeNextStepSuggestions } from "./sanitize-suggestions.js";

function buildAfterInspirationTurnSuggestionsPrompt(
  profile: ReturnType<typeof parseProfile>,
  brief: WorkBrief,
  lastAssistantReply: string,
  lastUserMessage: string,
): string {
  return `你是「有感 Yougan」灵感搭子。灵感模式回合已结束，请根据**上一条 AI 回复**（含若干可能性及其结果分析），生成 ${TURN_NEXT_STEP_SUGGESTIONS_COUNT} 条**下一步工作**可点击建议。

当前 brief：
${briefSummary(brief)}

作品特征：
${profileSummary(profile)}

${YOUGAN_USER_LABEL}上一条消息：
${lastUserMessage || "（无）"}

灵感节点刚回复的全文（须以此为依据，勿编造未出现的方案）：
${lastAssistantReply}

生成要求：
1. **与正文方案对齐**：若正文列出多个可能性，每条 suggestion 的 message 须**复述该方向的具体要点**（平台/受众/角度/结论），像用户亲自打字；禁止用「第一个/第二个/方案一/选 A」等指代而不写清内容
2. 可含 1 条 confirm（用户确认某条 brief 要点）或 navigate（brief 已较完整时引导定稿/切换创作），总数仍为 ${TURN_NEXT_STEP_SUGGESTIONS_COUNT}
3. label：仅结构化摘要（≤10 字），可取 message 开头关键词；**前端只展示 message，不展示 label**
4. message：用户点击后**原样写入对话**的完整口语化中文，一句说清下一步意图，**不超过 ${MAX_NEXT_STEP_SUGGESTION_LENGTH} 字**
5. 互斥、可执行；禁止客服腔；勿与正文分析矛盾
6. **禁止**「补充想法 / 我还有其他想法 / 自由发挥」类兜底选项——这类引导只写在 hint

hint：一行操作指引（≤14 字），如「点一条继续，或直接输入」；勿写能力说明或右侧面板。`;
}

function fallbackAfterInspirationTurnSuggestions(
  brief: WorkBrief,
): BriefSuggestions {
  const hasRequirements = brief.requirements.length > 0;
  const suggestions = hasRequirements
    ? [
        newBriefSuggestion(
          "explore",
          "收窄受众",
          "我想把目标受众再收窄一点，结合刚才的分析帮我对齐",
        ),
        newBriefSuggestion(
          "confirm",
          "确认要点",
          "brief 里刚才那条核心要点我认可，帮我记进作品面板",
        ),
        newBriefSuggestion(
          "navigate",
          "进入大纲",
          "brief 差不多了，进入大纲模式确认结构",
        ),
        newBriefSuggestion(
          "explore",
          "再对比",
          "帮我把刚才提到的几个方向用同一张表对比优劣",
        ),
      ]
    : [
        newBriefSuggestion(
          "explore",
          "定平台体裁",
          "还没想好发哪个平台和体裁，结合刚才分析帮我定一个",
        ),
        newBriefSuggestion(
          "explore",
          "深化选题",
          "我想把刚才最有潜力的那个选题写成能直接开写的标题",
        ),
        newBriefSuggestion(
          "explore",
          "补案例",
          "帮我补 2 个和刚才方向匹配的真实案例角度",
        ),
        newBriefSuggestion(
          "explore",
          "再对比",
          "帮我把刚才几个方向的受众、成本和风险再对比一下",
        ),
      ];

  return {
    hint: DEFAULT_BRIEF_SUGGESTIONS_HINT,
    suggestions: sanitizeNextStepSuggestions(suggestions),
  };
}

export async function generateAfterInspirationTurnSuggestions(
  state: AgentStateType,
): Promise<BriefSuggestions | null> {
  const profile = parseProfile(state);
  const brief = parseBrief(state);
  const { lastAssistant, lastUser } = extractLastMessages(state);

  if (!lastAssistant.trim()) {
    return null;
  }

  const llm = createStructuredModel({ temperature: 0.6 });
  const prompt = buildAfterInspirationTurnSuggestionsPrompt(
    profile,
    brief,
    lastAssistant,
    lastUser,
  );

  try {
    const parsed = await invokeStructuredOutput(
      llm,
      TurnNextStepSuggestionsResponseSchema,
      [new HumanMessage(prompt)],
      { name: "turn_next_step_suggestions" },
    );
    return {
      hint: parsed.hint?.trim() || DEFAULT_BRIEF_SUGGESTIONS_HINT,
      suggestions: sanitizeNextStepSuggestions(
        parsed.suggestions.map((s) =>
          newBriefSuggestion(s.kind, s.label, s.message),
        ),
      ),
    };
  } catch {
    return fallbackAfterInspirationTurnSuggestions(brief);
  }
}
