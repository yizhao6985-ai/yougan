import { sanitizeAutoConversationTitle } from "@yougan/domain";

export function sanitizeSuggestedConversationTitle(
  raw: string | undefined,
): string | undefined {
  const sanitized = sanitizeAutoConversationTitle(raw);
  return sanitized ?? undefined;
}
