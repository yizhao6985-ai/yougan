import {
  isDefaultConversationTitle,
  MAX_CONVERSATION_TITLE_LENGTH,
} from "@yougan/domain";

import {
  blueprintSummary,
  referencesSummary,
} from "#agent/prompt/context.js";
import { YOUGAN_USER_LABEL } from "#agent/prompt/persona.js";
import type { AgentStateType } from "#agent/state.js";
import { parseBlueprint, parseProfile } from "#agent/lib/parse-agent-state.js";
import { getLatestHumanMessageImageUrls } from "#agent/lib/human-message/index.js";
import { shouldSuggestConversationTitle } from "#agent/lib/conversation-title/should-suggest-conversation-title.js";

export function buildTurnQueuePrompt(
  state: AgentStateType,
  userMessage: string,
  options?: { requestConversationTitle?: boolean },
): string {
  const blueprint = parseBlueprint(state);
  const profile = parseProfile(state);
  const hasDraft = Boolean(state.draft?.body?.trim());
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
- **blueprint**：修改**作品方案**（创作主题、体裁形式、受众语气、定位、写作要求、内容节拍/结构）
- **creation**：修改**作品成稿**（标题、正文、语气润色、出稿、改稿、按方案制作交付）
- **ask**：主要在提问、要建议、要分析（答疑，不改方案与成稿）

## 意图判定（看用户描述的修改对象 / 宾语）
- 宾语是**方案 / 蓝图 / 结构 / 节拍 / 章节 / 体裁 / 主题 / 受众 / 定位 / 要求** → blueprint
- 宾语是**作品 / 成稿 / 正文 / 标题 / 段落 / 文案 / 预览** → creation
- 已有成稿（has_draft=${hasDraft}）且未明确动方案时，**默认 creation**（当成稿修订）
- 复合意图：先 blueprint 后 creation（例：「第二节改讲性价比，正文也一起改」→ blueprint, creation）
- 只讨论方案、无出稿/改稿动词 → 不要 creation
- 传图并说明素材用法 → 通常含 blueprint
- 只使用上述三种 kind；队列至少 1 项

当前作品方案：
${blueprintSummary(blueprint)}

${referencesSummary(profile)}

${YOUGAN_USER_LABEL}最新一条消息：
${userMessage || (imageCount > 0 ? "（仅上传图片，无文字说明）" : "（空）")}`;
}
