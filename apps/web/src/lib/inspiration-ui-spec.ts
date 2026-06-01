import type { InspirationSuggestions } from "@/lib/types";
import { DEFAULT_INSPIRATION_SUGGESTIONS_HINT } from "@/lib/types";

export type { InspirationSuggestions };

export { DEFAULT_INSPIRATION_SUGGESTIONS_HINT as DEFAULT_INSPIRATION_UI_HINT };

const KIND_LABELS: Record<string, string> = {
  explore: "探索",
  confirm: "确认",
  navigate: "下一步",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeInspirationSuggestions(
  input: unknown,
): InspirationSuggestions | null {
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
      return { id: id || message, kind, label, message };
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

/** @deprecated 使用 normalizeInspirationSuggestions */
export function normalizeInspirationChoices(
  input: unknown,
): { hint?: string; options: Array<{ description: string; letter?: string }> } | null {
  const normalized = normalizeInspirationSuggestions(input);
  if (normalized) {
    return {
      hint: normalized.hint,
      options: normalized.suggestions.map((s, i) => ({
        description: s.message,
        letter: s.label.slice(0, 1) || String.fromCharCode(65 + i),
      })),
    };
  }
  if (!isRecord(input) || !Array.isArray(input.options)) return null;
  const options = input.options
    .map((item, index) => {
      if (!isRecord(item)) return null;
      const description =
        typeof item.description === "string" ? item.description.trim() : "";
      if (!description) return null;
      return {
        description,
        letter:
          typeof item.letter === "string"
            ? item.letter
            : String.fromCharCode(65 + index),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
  if (options.length < 2) return null;
  return { hint: typeof input.hint === "string" ? input.hint : undefined, options };
}

export function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}
