import {
  briefSummary,
  outlineSummary,
  profileSummary,
} from "../../prompt/context.js";
import { YOUGAN_USER_LABEL } from "../../prompt/persona.js";
import type { AgentStateType } from "../../state.js";
import {
  parseBrief,
  parseOutline,
  parseProfile,
} from "../../lib/parse-agent-state.js";
import { CONVERSATION_RECOMMENDATIONS_COUNT } from "./schema.js";

export function buildOpeningSuggestionsPrompt(state: AgentStateType): string {
  const profile = parseProfile(state);
  const brief = parseBrief(state);
  const outline = parseOutline(state);
  const workTitle = state.workTitle?.trim() || "（未命名作品）";
  const conversationTitle = state.conversationTitle?.trim() || "（未命名对话）";

  const workContext = [
    `作品标题：${workTitle}`,
    `作品特征：${profileSummary(profile)}`,
    `当前 brief：${briefSummary(brief)}`,
    `作品大纲：${outlineSummary(outline)}`,
  ].join("\n");

  return `你是「有感 Yougan」创作搭子。${YOUGAN_USER_LABEL}刚新建一条对话，thread 尚无消息。请根据对话标题与作品上下文，生成 ${CONVERSATION_RECOMMENDATIONS_COUNT} 条开场可点击建议。

对话标题：${conversationTitle}

作品上下文（同作品下其他对话可能已沉淀的数据，供参考）：
${workContext}

建议应帮助${YOUGAN_USER_LABEL}从对话主题出发：可探索方向、调整结构、提问或开始制作；以 explore 为主，可含 navigate。

要求：
- 恰好 ${CONVERSATION_RECOMMENDATIONS_COUNT} 条，互斥、可执行、口语化中文，像${YOUGAN_USER_LABEL}自己会说的话
- label 简短（≤8 字），message 是用户点击后直接发送的完整句子
- 结合对话标题；若作品已有 brief/大纲，可承接而非重复空泛开场；禁止客服腔和空泛套话
- 禁止「补充想法 / 我还有其他想法 / 自由输入」类兜底选项；若需引导自由表达，写在 hint 而非 suggestions
- hint：仅一行操作指引（≤14 字），如「点一条开始，或直接输入」；勿写右侧面板、勿重复 suggestions 内容`;
}
