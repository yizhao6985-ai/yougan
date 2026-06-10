import { YOUGAN_USER_LABEL } from "#agent/system-prompt.js";

import type { NextStepSuggestionsPromptInput } from "./types.js";

export function buildRecentMessagesBlock(
  input: NextStepSuggestionsPromptInput,
): string {
  if (input.isOpening) return "";

  const lastUser = input.lastUserMessage?.trim() ?? "";
  const lastAssistant = input.lastAssistantReply?.trim() ?? "";

  return `

${YOUGAN_USER_LABEL}上一条消息（优先承接其意图）：
${lastUser || "（无）"}

AI 刚回复的全文：
${lastAssistant || "（无）"}`;
}
