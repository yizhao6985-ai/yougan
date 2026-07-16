import { nanoid } from "nanoid";

import type { TurnDirection } from "@yougan/domain";

export function newTurnDirection(input: {
  label: string;
  prompt: string;
  outcome: string;
}): TurnDirection {
  return {
    id: nanoid(8),
    label: input.label.trim(),
    prompt: input.prompt.trim(),
    outcome: input.outcome.trim(),
  };
}
