import {
  DEFAULT_NEXT_STEP_SUGGESTIONS_HINT,
  MAX_NEXT_STEP_SUGGESTION_DISPLAY_LENGTH,
  type NextStepSuggestion,
  type NextStepSuggestions,
} from "../models/suggestions.js";
import { normalizeNextStepSuggestionMessage } from "./suggestions.js";

export const NEXT_STEP_SUGGESTION_KIND_LABELS: Record<
  NextStepSuggestion["kind"],
  string
> = {
  explore: "探索",
  confirm: "确认",
  navigate: "下一步",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeNextStepSuggestions(
  input: unknown,
): NextStepSuggestions | null {
  if (!isRecord(input)) return null;

  const suggestionsRaw = input.suggestions;
  if (!Array.isArray(suggestionsRaw)) return null;

  const suggestions = suggestionsRaw
    .map((item) => {
      if (!isRecord(item)) return null;
      const label = typeof item.label === "string" ? item.label.trim() : "";
      const message = normalizeNextStepSuggestionMessage(
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
        kind: kind as NextStepSuggestion["kind"],
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
  return NEXT_STEP_SUGGESTION_KIND_LABELS[kind as NextStepSuggestion["kind"]] ?? kind;
}

export function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

export {
  DEFAULT_NEXT_STEP_SUGGESTIONS_HINT,
  MAX_NEXT_STEP_SUGGESTION_DISPLAY_LENGTH,
};
