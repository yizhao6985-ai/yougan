import {
  isDefaultConversationTitle,
  MAX_CONVERSATION_TITLE_LENGTH,
} from "@yougan/domain";

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
import { getLatestHumanMessageImageUrls } from "../../lib/human-message/index.js";
import { shouldSuggestConversationTitle } from "../../lib/conversation-title/should-suggest-conversation-title.js";

export function buildTurnQueuePrompt(
  state: AgentStateType,
  userMessage: string,
  options?: { requestConversationTitle?: boolean },
): string {
  const brief = parseBrief(state);
  const outline = parseOutline(state);
  const profile = parseProfile(state);
  const imageCount = getLatestHumanMessageImageUrls(state.messages).length;
  const conversationTitle = state.conversationTitle?.trim() || "（未命名）";
  const requestTitle =
    options?.requestConversationTitle ??
    shouldSuggestConversationTitle(state);
  const titleSection = requestTitle
    ? `
## 对话自动标题（本回合必填 conversationTitle）
- 当前对话标题为系统占位：「${conversationTitle}」
- 这是用户在本对话的**第一条发言**，请根据最新消息用 **不超过 ${MAX_CONVERSATION_TITLE_LENGTH} 字**的中文短语概括主题（总结，不要照抄整句）
- 仅图片无文字时，可写如「参考图选题讨论」；不要含「对话」字样、不要加引号
`
    : `
## 对话标题
- 当前标题：「${conversationTitle}」${isDefaultConversationTitle(conversationTitle) ? "（占位）" : "（用户已命名，勿输出 conversationTitle）"}
- **不要**输出 conversationTitle 字段
`;

  return `你是回合编排助手。根据${YOUGAN_USER_LABEL}**最新一条消息**，输出本轮**有序队列 kinds**（每项对应一次对话子图，会有可见回复与工具调用）。
${titleSection}

## 可选队列项（按推荐执行顺序）
- **outline**：改内容结构、增删改大纲条目、讨论章节安排（走大纲对话与工具）
- **inspiration**：探索方向、对齐选题/受众/平台；记/改/删 brief 需求（走灵感对话与 brief 工具）
- **creation**：明确要求出稿、改稿、按大纲制作交付
- **ask**：主要在提问、要建议、要分析（答疑，不改稿）

## 规则
- **所有状态变更均通过对话子图完成**（会有 assistant 回复）；UI 侧栏直改不走本队列
- 一条消息可含多项（例：先 inspiration 记需求，再 outline 改第二节 → inspiration, outline）
- 传图并说明素材用法 → 通常含 inspiration（参考图在子图 prepare 阶段同步）
- 删/改 brief 条目 → inspiration；改大纲 → outline
- 只使用上述四种 kind；队列至少 1 项

当前 brief（${brief.requirements.length} 条）：
${briefSummary(brief)}

${profileSummary(profile)}

当前大纲（${outline.sections.length} 条）：
${outlineSummary(outline)}

${YOUGAN_USER_LABEL}最新一条消息：
${userMessage || (imageCount > 0 ? "（仅上传图片，无文字说明）" : "（空）")}`;
}
