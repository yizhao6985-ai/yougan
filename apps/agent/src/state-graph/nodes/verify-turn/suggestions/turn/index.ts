/** 回合末 4 条 nextStepSuggestions（队列执行完毕后） */
import { HumanMessage } from "@langchain/core/messages";

import {
  DEFAULT_NEXT_STEP_SUGGESTIONS_HINT,
  newNextStepSuggestion,
  type NextStepSuggestions,
  type TurnQueueKind,
} from "@yougan/domain";

import { createStructuredModel } from "#agent/model/dashscope.js";
import { invokeStructuredOutput } from "#agent/llm/structured-output.js";
import {
  profileSummary,
  productionPlanSummary,
  referencesSummary,
} from "@yougan/domain";
import { YOUGAN_USER_LABEL } from "#agent/system-prompt.js";
import {
  getCompletedTurnKinds,
  getPreview,
  getProductionPlan,
  getProfile,
} from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";
import { extractLastMessages } from "../extract-last-messages.js";
import {
  TurnNextStepSuggestionsResponseSchema,
  TURN_NEXT_STEP_SUGGESTIONS_COUNT,
} from "../schema.js";
import { generateAfterProfileTurnSuggestions } from "./profile.js";

function completedKindsLabel(kinds: TurnQueueKind[]): string {
  if (!kinds.length) return "（本轮无子图执行）";
  return kinds.join("、");
}

function buildTurnSuggestionsPrompt(
  state: AgentStateType,
  lastAssistantReply: string,
  lastUserMessage: string,
): string {
  const profile = getProfile(state);
  const plan = getProductionPlan(state);
  const preview = getPreview(state);
  const completed = getCompletedTurnKinds(state);

  return `你是「有感 Yougan」创作搭子。本轮队列已执行完毕（${completedKindsLabel(completed)}），请根据**回合前后状态与上一条 AI 回复**，生成 ${TURN_NEXT_STEP_SUGGESTIONS_COUNT} 条**下一步工作**可点击建议。

${profileSummary(profile)}
${referencesSummary(profile.references)}
${productionPlanSummary(plan)}
${preview?.body?.trim() ? `已有预览正文（节选）：${preview.body.slice(0, 200)}…` : "尚无预览成稿"}

${YOUGAN_USER_LABEL}上一条消息：
${lastUserMessage || "（无）"}

AI 刚回复的全文：
${lastAssistantReply}

生成要求：
1. 结合本轮完成的子图类型（profile / production / ask）给出**具体可执行**的下一步
2. message 须像用户亲自打字，点名具体主题或段落；禁止空泛套话
3. label ≤10 字；message 一句说清、可稍长，点击后原样发送
4. hint：仅一行操作指引（≤14 字）`;
}

function fallbackTurnSuggestions(state: AgentStateType): NextStepSuggestions {
  const completed = getCompletedTurnKinds(state);
  const hasPreview = Boolean(getPreview(state)?.body?.trim());

  if (completed.includes("production") || hasPreview) {
    return {
      hint: DEFAULT_NEXT_STEP_SUGGESTIONS_HINT,
      suggestions: [
        newNextStepSuggestion(
          "explore",
          "改标题",
          "标题我想更抓眼球一点，结合刚才成稿帮我改一版",
        ),
        newNextStepSuggestion(
          "explore",
          "润色正文",
          "正文第二段语气太硬，帮我改得更口语一些",
        ),
        newNextStepSuggestion(
          "explore",
          "补配图",
          "帮我给这篇补 2 张配图方向说明",
        ),
        newNextStepSuggestion(
          "navigate",
          "准备发布",
          "成稿差不多了，帮我检查能不能发布",
        ),
      ],
    };
  }

  return {
    hint: DEFAULT_NEXT_STEP_SUGGESTIONS_HINT,
    suggestions: [
      newNextStepSuggestion(
        "explore",
        "深化方案",
        "帮我把刚才讨论的方向写进作品方案",
      ),
      newNextStepSuggestion(
        "explore",
        "补节拍",
        "帮我把内容结构整理成 4 个可写节拍",
      ),
      newNextStepSuggestion(
        "navigate",
        "开始制作",
        "方案可以了，按当前方案开始出稿吧",
      ),
      newNextStepSuggestion(
        "explore",
        "再问问",
        "我还有个问题想先讨论清楚再动笔",
      ),
    ],
  };
}

export async function generateTurnSuggestions(
  state: AgentStateType,
): Promise<NextStepSuggestions | null> {
  const completed = getCompletedTurnKinds(state);

  if (
    completed.length === 1 &&
    completed[0] === "profile" &&
    !completed.includes("production")
  ) {
    return generateAfterProfileTurnSuggestions(state);
  }

  const { lastAssistant, lastUser } = extractLastMessages(state);
  if (!lastAssistant.trim()) {
    return fallbackTurnSuggestions(state);
  }

  const llm = createStructuredModel({ temperature: 0.6 });
  const prompt = buildTurnSuggestionsPrompt(state, lastAssistant, lastUser);

  try {
    const parsed = await invokeStructuredOutput(
      llm,
      TurnNextStepSuggestionsResponseSchema,
      [new HumanMessage(prompt)],
      { name: "turn_next_step_suggestions" },
    );
    return {
      hint: parsed.hint?.trim() || DEFAULT_NEXT_STEP_SUGGESTIONS_HINT,
      suggestions: parsed.suggestions.map((s) =>
        newNextStepSuggestion(s.kind, s.label, s.message),
      ),
    };
  } catch {
    return fallbackTurnSuggestions(state);
  }
}
