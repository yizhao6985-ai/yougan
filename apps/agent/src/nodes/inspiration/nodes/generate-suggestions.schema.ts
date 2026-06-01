import { z } from "zod";

export const BRIEF_SUGGESTIONS_COUNT = 4;

export const BriefSuggestionSchema = z.object({
  id: z.string(),
  kind: z.enum(["explore", "confirm", "navigate"]),
  label: z.string(),
  message: z.string(),
});

export const BriefSuggestionsResponseSchema = z.object({
  hint: z.string().optional(),
  suggestions: z.array(
    z.object({
      kind: z.enum(["explore", "confirm", "navigate"]),
      label: z.string(),
      message: z.string(),
    }),
  ),
});
