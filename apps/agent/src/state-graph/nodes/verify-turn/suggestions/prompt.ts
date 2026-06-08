/** 下一步建议 prompt（开屏与回合末共用，仅条数与上下文不同） */
import {
  profileSummary,
  productionPlanSummary,
  profileReferencesSummary,
  type TurnQueueKind,
} from "@yougan/domain";

import { YOUGAN_USER_LABEL } from "#agent/system-prompt.js";
import {
  getCompletedTurnKinds,
  getPreview,
  getProductionPlan,
  getProfile,
  getReferences,
} from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";
import { hasSuggestionWorkContext } from "./work-context.js";

function completedKindsLabel(kinds: TurnQueueKind[]): string {
  if (!kinds.length) return "（本轮无子图执行）";
  return kinds.join("、");
}

function stagingNote(state: AgentStateType): string {
  const hasStaging =
    Boolean(state.staging?.profile) ||
    Boolean(state.staging?.references?.length) ||
    Boolean(state.staging?.productionPlan) ||
    Boolean(state.staging?.preview);
  return hasStaging
    ? "（作品字段读 staging 优先：含本回合未提交的修改）"
    : "";
}

export type NextStepSuggestionsPromptInput = {
  count: number;
  isOpening: boolean;
  lastUserMessage?: string;
  lastAssistantReply?: string;
};

export function buildNextStepSuggestionsPrompt(
  state: AgentStateType,
  input: NextStepSuggestionsPromptInput,
): string {
  const { count, isOpening, lastUserMessage, lastAssistantReply } = input;
  const topicMode = isOpening && !hasSuggestionWorkContext(state);

  const profile = getProfile(state);
  const references = getReferences(state);
  const plan = getProductionPlan(state);
  const preview = getPreview(state);
  const completed = getCompletedTurnKinds(state);
  const workTitle = state.workTitle?.trim() || "（未命名作品）";
  const lastUser = lastUserMessage?.trim() ?? "";
  const lastAssistant = lastAssistantReply?.trim() ?? "";

  const sceneIntro = topicMode
    ? `${YOUGAN_USER_LABEL}刚打开本对话，thread 尚无消息，且作品尚无已沉淀方案。请根据**作品标题**生成 ${count} 条**可立刻开写的具体选题**可点击建议。`
    : isOpening
      ? `${YOUGAN_USER_LABEL}刚在本作品下打开新对话，thread 尚无消息。请根据**作品当前进展**（state 顶层与 staging，staging 优先）生成 ${count} 条**下一步工作**可点击建议。`
      : `本轮队列已执行完毕（${completedKindsLabel(completed)}）。请根据**作品当前进展、staging、${YOUGAN_USER_LABEL}上一条消息与 AI 刚回复**，生成 ${count} 条**下一步工作**可点击建议。`;

  const messageBlock =
    !isOpening
      ? `

${YOUGAN_USER_LABEL}上一条消息（优先承接其意图）：
${lastUser || "（无）"}

AI 刚回复的全文：
${lastAssistant || "（无）"}`
      : "";

  const profileTurnHint =
    !isOpening &&
    completed.includes("profile") &&
    !completed.includes("production")
      ? `

本轮主要完成 profile 方案维护：优先引导修改规格/要求/节拍（explore），或方案已可执行时 navigate 开始出稿。`
      : "";

  const topicRequirements = topicMode
    ? `

## 选题要求（作品尚空白）
- 每条 = 一个**写得出标题的选题**（含场景/对象/切口），像用户会真的去写的那篇内容
- message 里要点名：写什么、给谁看、什么角度
- 好例：「我想写转行前 3 个简历坑，面向 3–5 年想跳槽的职场人」
- 坏例（禁止）：「聊聊方向」「定受众」「找灵感」「探索可能性」「优化内容」「理清思路」
- 恰好 ${count} 条，互斥、可区分，覆盖不同子题/体裁/切口，全部落在标题相关领域内
- kind 以 explore 为主
- label：选题短名（≤10 字）`
    : `

## 生成要求
1. 结合当前阶段（方案拟定 / 答疑 / 制作计划 / 出稿 / 改稿 / 发布准备）给出**具体可执行**的下一步，承接上表状态与（若有）用户上一条消息
2. **禁止**把已有方案或成稿进度当成空白来推「选题」；不要生成「我想写一篇…具体选题」类消息，除非作品规格里确实尚无创作主题且用户在补创作方向
3. message 须像用户亲自打字，点名方案中的具体主题、节拍、段落或制作环节；禁止空泛套话（如「聊聊方向」「找灵感」「理清思路」「探索可能性」）
4. label ≤10 字；message 一句说清、可稍长，点击后原样发送
5. kind：explore / confirm / navigate 按意图选择；方案已可执行时可 navigate 开始出稿
6. 恰好 ${count} 条，互斥、可区分`;

  const hintRule = topicMode
    ? "hint：留空字符串（开屏操作指引由前端标题统一展示）"
    : "hint：仅一行操作指引（≤14 字）";

  return `你是「有感 Yougan」创作搭子。${sceneIntro}

## 作品标题
${workTitle}${stagingNote(state)}

## 作品状态
${profileSummary(profile, references)}
${profileReferencesSummary(references)}
${productionPlanSummary(plan)}
${preview?.body?.trim() ? `已有预览正文（节选）：${preview.body.slice(0, 200)}…` : "尚无预览成稿"}${messageBlock}${profileTurnHint}${topicRequirements}

## 禁止
- 不要围绕对话标题或「对话 N」类占位名发挥（除非与作品标题相同）
- 禁止流程动作、客服腔、空泛套话、「补充想法 / 自由输入」类兜底
- ${hintRule}；勿写右侧面板、勿重复 suggestions`;
}
