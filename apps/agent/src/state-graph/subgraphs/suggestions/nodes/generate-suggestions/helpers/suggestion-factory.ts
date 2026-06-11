import { nanoid } from "nanoid";

import type { NextStepSuggestion, NextStepSuggestionKind } from "@yougan/domain";

export function newNextStepSuggestion(
  kind: NextStepSuggestionKind,
  label: string,
  message: string,
): NextStepSuggestion {
  return { id: nanoid(8), kind, label, message };
}
