import { nanoid } from "nanoid";

import type {
  ProfileSetupDirectionRole,
  ProfileStepId,
  TurnDirection,
} from "@yougan/domain";

export function newTurnDirection(input: {
  label: string;
  prompt: string;
  outcome: string;
  step?: ProfileStepId | "ready";
  role?: ProfileSetupDirectionRole;
}): TurnDirection {
  return {
    id: nanoid(8),
    label: input.label.trim(),
    prompt: input.prompt.trim(),
    outcome: input.outcome.trim(),
    ...(input.step ? { step: input.step } : {}),
    ...(input.role ? { role: input.role } : {}),
  };
}
