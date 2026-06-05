/** 开屏 7 条选题建议 prompt */
import {
  profileSummary,
  referencesSummary,
} from "@yougan/domain";
import { YOUGAN_USER_LABEL } from "#agent/system-prompt.js";
import type { AgentStateType } from "#agent/state.js";
import { parseProfile } from "#agent/runtime/state-readers.js";
import { OPENING_TOPIC_SUGGESTIONS_COUNT } from "../schema.js";

export function buildOpeningTopicSuggestionsPrompt(
  state: AgentStateType,
): string {
  const profile = parseProfile(state);
  const workTitle = state.workTitle?.trim() || "（未命名作品）";

  const existingWorkContext = [
    referencesSummary(profile.references),
    `当前作品方案：${profileSummary(profile)}`,
  ].join("\n");

  const hasPriorWork =
    profile.beats.length > 0 ||
    profile.constraints.length > 0 ||
    Boolean(profile.premise.trim()) ||
    Boolean(profile.spec.content_topic);

  return `你是「有感 Yougan」创作搭子。${YOUGAN_USER_LABEL}刚打开本对话，thread 尚无消息。请根据**作品标题与作品特征**生成 ${OPENING_TOPIC_SUGGESTIONS_COUNT} 条**可立刻开写的具体选题**可点击建议。

## 主锚点（必须紧扣）
作品标题：${workTitle}

## 同作品已沉淀（若有则承接，勿与标题脱节）
${existingWorkContext}
${hasPriorWork ? "（已有作品方案时：选题应衔接已有方向，给出更细切口或相邻子题，禁止空泛重来）" : "（作品尚空白：从标题 + 受众/体裁推断该用户**现实会写的选题范围**，给出互斥的具体题，不是创作流程）"}

## 具体性要求（核心）
- 每条 = 一个**写得出标题的选题**（含场景/对象/切口），像用户会真的去写的那篇内容
- message 里要点名：写什么、给谁看、什么角度（若方案 spec 有体裁/受众须用上）
- 好例（具体）：「我想写转行前 3 个简历坑，面向 3–5 年想跳槽的职场人」
- 坏例（笼统，禁止）：「聊聊方向」「定受众」「找灵感」「探索可能性」「优化内容」「理清思路」「补充想法」
- 不要默认绑定某个社交媒体平台；除非用户标题或方案里已明确

## 覆盖与区分
- 恰好 ${OPENING_TOPIC_SUGGESTIONS_COUNT} 条，互斥、可区分，覆盖不同子题/体裁/切口（如：踩坑清单、对比评测、案例故事、入门教程、趋势解读、反常识、工具合集等），但**全部落在标题相关领域内**
- kind 以 explore 为主；若作品方案已较完整可含至多 1 条 confirm 或 navigate
- label：选题短名（≤10 字），须能一眼看出写什么
- message：用户点击后原样发送的完整口语化中文，一句说清具体选题

## 禁止
- 不要围绕对话标题或「对话 N」类占位名发挥（除非与作品标题相同）
- 禁止流程动作、客服腔、空泛套话、「补充想法 / 自由输入」类兜底
- hint：留空字符串（开屏操作指引由前端标题统一展示）；勿写右侧面板、勿重复 suggestions`;
}
