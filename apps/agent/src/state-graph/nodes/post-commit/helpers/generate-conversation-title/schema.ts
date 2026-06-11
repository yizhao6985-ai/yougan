/** 生成对话标题结构化输出 */
import { z } from "zod";

import { MAX_CONVERSATION_TITLE_LENGTH } from "@yougan/domain";

export const ConversationTitleResponseSchema = z.object({
  conversationTitle: z
    .string()
    .min(2)
    .max(MAX_CONVERSATION_TITLE_LENGTH)
    .describe(
      `用不超过 ${MAX_CONVERSATION_TITLE_LENGTH} 字的中文短语概括本对话主题；不要引号、不要含「对话」字样`,
    ),
});
