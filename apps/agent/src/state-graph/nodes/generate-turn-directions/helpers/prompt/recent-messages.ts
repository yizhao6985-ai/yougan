import type { TurnDirectionsPromptInput } from "./types.js";

export function buildRecentMessagesBlock(
  input: TurnDirectionsPromptInput,
): string {
  if (input.isOpening) return "";
  const user = input.lastUserMessage?.trim();
  if (!user) return "";
  return `

## 感友上一条消息
${user}`;
}
