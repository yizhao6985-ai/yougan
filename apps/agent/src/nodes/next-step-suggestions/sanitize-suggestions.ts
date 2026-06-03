import { sanitizeNextStepSuggestionMessage } from "@yougan/domain";

import type { BriefSuggestion } from "../../schema.js";

/** 不应作为可点击选项的「自由补充」类兜底话术 */
const SUPPLEMENT_OPTION_RE =
  /(?:还有|其他).{0,8}想法|补充想法|自由(?:发挥|输入)|我(?:还)?(?:有|想).{0,6}(?:想法|补充)/;

export function dropGenericSupplementOptions(
  suggestions: BriefSuggestion[],
): BriefSuggestion[] {
  return suggestions.filter(
    (s) => !SUPPLEMENT_OPTION_RE.test(`${s.label}${s.message}`),
  );
}

export function sanitizeNextStepSuggestions(
  suggestions: BriefSuggestion[],
): BriefSuggestion[] {
  return dropGenericSupplementOptions(
    suggestions
      .map((s) => ({
        ...s,
        message: sanitizeNextStepSuggestionMessage(s.message),
      }))
      .filter((s) => s.message.length > 0),
  );
}
