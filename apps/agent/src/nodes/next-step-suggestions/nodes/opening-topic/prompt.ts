import {
  briefSummary,
  outlineSummary,
  profileSummary,
} from "../../../../prompt/context.js";
import { YOUGAN_USER_LABEL } from "../../../../prompt/persona.js";
import type { AgentStateType } from "../../../../state.js";
import {
  parseBrief,
  parseOutline,
  parseProfile,
} from "../../../../lib/parse-agent-state.js";
import { OPENING_TOPIC_SUGGESTIONS_COUNT } from "../shared/schema.js";
import { MAX_NEXT_STEP_SUGGESTION_LENGTH } from "@yougan/domain";

export function buildOpeningTopicSuggestionsPrompt(
  state: AgentStateType,
): string {
  const profile = parseProfile(state);
  const brief = parseBrief(state);
  const outline = parseOutline(state);
  const workTitle = state.workTitle?.trim() || "（未命名作品）";

  const existingWorkContext = [
    `作品特征：${profileSummary(profile)}`,
    `当前 brief：${briefSummary(brief)}`,
    `作品大纲：${outlineSummary(outline)}`,
  ].join("\n");

  const hasPriorWork =
    brief.requirements.length > 0 || outline.sections.length > 0;

  return `你是「有感 Yougan」创作搭子。${YOUGAN_USER_LABEL}刚打开本对话，thread 尚无消息。请根据**作品标题与作品特征**生成 ${OPENING_TOPIC_SUGGESTIONS_COUNT} 条**可立刻开写的具体选题**可点击建议。

## 主锚点（必须紧扣）
作品标题：${workTitle}

## 同作品已沉淀（若有则承接，勿与标题脱节）
${existingWorkContext}
${hasPriorWork ? "（已有 brief/大纲时：选题应衔接已有方向，给出更细切口或相邻子题，禁止空泛重来）" : "（作品尚空白：从标题 + 平台/受众/体裁推断该用户**现实会写的选题范围**，给出互斥的具体题，不是创作流程）"}

## 具体性要求（核心）
- 每条 = 一个**写得出标题的选题**（含场景/对象/切口），像用户会真的去写的那篇内容
- message 里要点名：写什么、给谁看、什么角度（可含平台体裁，若 profile 有平台/受众须用上）
- 好例（具体）：「我想写小红书：转行前 3 个简历坑，面向 3–5 年想跳槽的职场人」（≤${MAX_NEXT_STEP_SUGGESTION_LENGTH} 字）
- 坏例（笼统，禁止）：「聊聊方向」「定受众」「找灵感」「探索可能性」「优化内容」「理清思路」「补充想法」

## 覆盖与区分
- 恰好 ${OPENING_TOPIC_SUGGESTIONS_COUNT} 条，互斥、可区分，覆盖不同子题/体裁/切口（如：踩坑清单、对比评测、案例故事、入门教程、趋势解读、反常识、工具合集等），但**全部落在标题相关领域内**
- kind 以 explore 为主；若 brief 已较完整可含至多 1 条 confirm 或 navigate
- label：选题短名（≤10 字），须能一眼看出写什么
- message：用户点击后直接发送的完整口语化中文，一句说清具体选题，**不超过 ${MAX_NEXT_STEP_SUGGESTION_LENGTH} 字**

## 禁止
- 不要围绕对话标题或「对话 N」类占位名发挥（除非与作品标题相同）
- 禁止流程动作、客服腔、空泛套话、「补充想法 / 自由输入」类兜底
- hint：留空字符串（开屏操作指引由前端标题统一展示）；勿写右侧面板、勿重复 suggestions`;
}
