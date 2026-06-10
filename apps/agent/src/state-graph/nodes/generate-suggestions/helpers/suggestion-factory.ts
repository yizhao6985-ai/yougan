import { nanoid } from "nanoid";

import type { NextStepSuggestion } from "@yougan/domain";

export function newNextStepSuggestion(
  kind: NextStepSuggestion["kind"],
  label: string,
  message: string,
): NextStepSuggestion {
  return { id: nanoid(8), kind, label, message };
}
