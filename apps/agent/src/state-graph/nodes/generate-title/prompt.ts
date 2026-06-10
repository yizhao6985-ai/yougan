import { MAX_CONVERSATION_TITLE_LENGTH } from "@yougan/domain";

import { profileSummary } from "#agent/prompts/profile-summary.js";
import { YOUGAN_USER_LABEL } from "#agent/system-prompt.js";
import { getProfile } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

export function buildGenerateConversationTitlePrompt(
  state: AgentStateType,
  userMessage: string,
  lastAssistantReply: string,
  hasAttachments: boolean,
): string {
  const profile = getProfile(state);
  const conversationTitle = state.conversationTitle?.trim() || "（未命名）";

  return `你是「有感 Yougan」对话标题助手。用户在本对话的**首条发言**后，需要把占位标题「${conversationTitle}」替换为简短主题名。

${profileSummary(profile)}

${YOUGAN_USER_LABEL}首条消息：
${userMessage || (hasAttachments ? "（仅上传参考素材，无文字说明）" : "（空）")}

AI 本轮回复（节选，供理解话题）：
${lastAssistantReply.trim() || "（尚无可见回复）"}

输出要求：
- conversationTitle：不超过 ${MAX_CONVERSATION_TITLE_LENGTH} 字的中文短语，概括创作主题（总结，不要照抄整句）
- 仅附件无文字时，可写如「参考素材讨论」
- 不要引号、不要含「对话」字样`;
}
