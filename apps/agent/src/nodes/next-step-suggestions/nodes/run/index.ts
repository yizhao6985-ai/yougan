import { isBlueprintActionable } from "@yougan/domain";

import { isEmptyThread } from "#agent/lib/empty/index.js";
import { parseCompletedTurnKinds } from "#agent/lib/parse-agent-state.js";
import type { BriefSuggestions } from "#agent/schema.js";
import type { AgentStateType } from "#agent/state.js";
import { generateAfterBlueprintTurnSuggestions } from "../after-turn/blueprint.js";
import { generateOpeningTopicSuggestions } from "../opening-topic/suggestions.js";

export async function runNextStepSuggestions(
  state: AgentStateType,
): Promise<
  | { openingNextStepSuggestions: BriefSuggestions }
  | { turnNextStepSuggestions: BriefSuggestions | null }
> {
  if (isEmptyThread(state)) {
    const openingNextStepSuggestions =
      await generateOpeningTopicSuggestions(state);
    return { openingNextStepSuggestions };
  }

  const completed = parseCompletedTurnKinds(state);
  if (!completed.includes("blueprint")) {
    return { turnNextStepSuggestions: null };
  }

  const turnNextStepSuggestions =
    await generateAfterBlueprintTurnSuggestions(state);
  return { turnNextStepSuggestions };
}

export { isBlueprintActionable };
