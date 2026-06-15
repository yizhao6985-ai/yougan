import { nanoid } from "nanoid";

import type {
  NextStepSuggestion,
  ProfileSetupSuggestionRole,
  ProfileStepId,
} from "@yougan/domain";

export function newNextStepSuggestion(
  message: string,
  extras?: {
    step?: ProfileStepId | "ready";
    role?: ProfileSetupSuggestionRole;
  },
): NextStepSuggestion {
  return {
    id: nanoid(8),
    message,
    ...(extras?.step ? { step: extras.step } : {}),
    ...(extras?.role ? { role: extras.role } : {}),
  };
}
