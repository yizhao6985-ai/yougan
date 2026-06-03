import {
  DEFAULT_BRIEF_SUGGESTIONS_HINT,
  MAX_NEXT_STEP_SUGGESTION_LENGTH,
  type BriefSuggestion,
  type BriefSuggestions,
} from "../models/suggestions.js";
import { sanitizeNextStepSuggestionMessage } from "./suggestions.js";

export const BRIEF_SUGGESTION_KIND_LABELS: Record<BriefSuggestion["kind"], string> =
  {
    explore: "探索",
    confirm: "确认",
    navigate: "下一步",
  };

/** 不应作为可点击选项的「自由补充」类兜底话术 */
const SUPPLEMENT_OPTION_RE =
  /(?:还有|其他).{0,8}想法|补充想法|自由(?:发挥|输入)|我(?:还)?(?:有|想).{0,6}(?:想法|补充)/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

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

export function normalizeBriefSuggestions(
  input: unknown,
): BriefSuggestions | null {
  if (!isRecord(input)) return null;

  const suggestionsRaw = input.suggestions;
  if (!Array.isArray(suggestionsRaw)) return null;

  const suggestions = suggestionsRaw
    .map((item) => {
      if (!isRecord(item)) return null;
      const label = typeof item.label === "string" ? item.label.trim() : "";
      const message = sanitizeNextStepSuggestionMessage(
        typeof item.message === "string" ? item.message : "",
      );
      const id = typeof item.id === "string" ? item.id : "";
      const kind = item.kind;
      if (!label || !message) return null;
      if (kind !== "explore" && kind !== "confirm" && kind !== "navigate") {
        return null;
      }
      return {
        id: id || message,
        kind: kind as BriefSuggestion["kind"],
        label,
        message,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (suggestions.length < 1) return null;

  const hint =
    typeof input.hint === "string" && input.hint.trim()
      ? input.hint.trim()
      : undefined;

  return { hint, suggestions };
}

export function suggestionKindLabel(kind: string): string {
  return BRIEF_SUGGESTION_KIND_LABELS[kind as BriefSuggestion["kind"]] ?? kind;
}

export function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

export { DEFAULT_BRIEF_SUGGESTIONS_HINT, MAX_NEXT_STEP_SUGGESTION_LENGTH };
