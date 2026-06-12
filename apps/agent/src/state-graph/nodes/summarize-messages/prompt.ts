import {
  AIMessage,
  HumanMessage,
  type BaseMessage,
} from "@langchain/core/messages";

import { YOUGAN_USER_LABEL } from "#agent/system-prompt.js";
import { messageContentToText } from "#agent/messages/message-content.js";

import { isSemanticMessage } from "./helpers/message-semantics.js";

function formatMessageForSummary(message: BaseMessage): string | null {
  const text = messageContentToText(message.content).trim();
  if (!text) return null;

  if (HumanMessage.isInstance(message)) {
    return `${YOUGAN_USER_LABEL}：${text}`;
  }
  if (AIMessage.isInstance(message)) {
    return `AI：${text}`;
  }
  return null;
}

export function buildSummarizeMessagesPrompt(input: {
  previousSummary: string | null;
  messages: BaseMessage[];
}): string {
  const dialogue = input.messages
    .filter(isSemanticMessage)
    .map(formatMessageForSummary)
    .filter(Boolean)
    .join("\n\n");

  const previousBlock = input.previousSummary?.trim()
    ? `## 已有滚动摘要\n${input.previousSummary.trim()}\n`
    : "";

  return `将以下对话压缩为一段滚动摘要，供后续回合 LLM 理解上下文。

${previousBlock}## 待压缩对话
${dialogue || "（无有效文本）"}

## 输出要求
1. summary：合并已有摘要（若有）与待压缩对话，形成一段连贯摘要
2. 保留：创作方向、作品方案变更、参考素材意图、制作/出稿决策、用户明确偏好
3. 省略：寒暄、重复确认、工具调用细节、格式化噪音
4. 使用中文，不超过 800 字`;
}
