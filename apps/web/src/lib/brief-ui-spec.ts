import type { BriefSuggestion, BriefSuggestions } from "@/lib/types";
import { DEFAULT_BRIEF_SUGGESTIONS_HINT } from "@/lib/types";

export type { BriefSuggestions };

export { DEFAULT_BRIEF_SUGGESTIONS_HINT as DEFAULT_BRIEF_UI_HINT };

const KIND_LABELS: Record<string, string> = {
  explore: "探索",
  confirm: "确认",
  navigate: "下一步",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
      const message = typeof item.message === "string" ? item.message.trim() : "";
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
  return KIND_LABELS[kind] ?? kind;
}

export function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}
