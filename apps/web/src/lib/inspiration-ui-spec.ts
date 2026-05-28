import type { InspirationChoices } from "@/lib/types";
import { DEFAULT_INSPIRATION_CHOICES_HINT } from "@/lib/types";

export type { InspirationChoices };

/** @deprecated 使用 InspirationChoices */
export type InspirationChoicesPayload = InspirationChoices;

export type InspirationChoice = InspirationChoices["options"][number];

export { DEFAULT_INSPIRATION_CHOICES_HINT as DEFAULT_INSPIRATION_UI_HINT };

export function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseChoiceOption(value: unknown): InspirationChoice | null {
  if (!isRecord(value)) return null;

  const descriptionRaw =
    typeof value.description === "string"
      ? value.description
      : typeof value.value === "string"
        ? value.value
        : "";

  const description = descriptionRaw.trim();
  if (!description) return null;

  const letter =
    typeof value.letter === "string" && value.letter.trim()
      ? value.letter.trim().toUpperCase()
      : undefined;

  return { letter, description };
}

export function normalizeInspirationChoices(
  input: unknown,
): InspirationChoices | null {
  if (!isRecord(input)) return null;

  const optionsRaw = input.options;
  if (!Array.isArray(optionsRaw)) return null;

  const options = optionsRaw
    .map((item, index) => {
      const parsed = parseChoiceOption(item);
      if (!parsed) return null;
      return {
        description: parsed.description,
        letter: parsed.letter ?? optionLetter(index),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (options.length < 2) return null;

  const hint =
    typeof input.hint === "string" && input.hint.trim()
      ? input.hint.trim()
      : undefined;

  return { hint, options };
}

/** @deprecated 使用 normalizeInspirationChoices */
export const normalizeInspirationChoicesPayload = normalizeInspirationChoices;
