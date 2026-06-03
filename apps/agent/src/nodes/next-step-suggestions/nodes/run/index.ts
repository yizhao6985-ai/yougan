import { hasOutlineContent } from "@yougan/domain";

import { isEmptyThread } from "#agent/lib/empty/index.js";
import {
  parseCompletedTurnKinds,
  parseOutline,
} from "#agent/lib/parse-agent-state.js";
import type { BriefSuggestions } from "#agent/schema.js";
import type { AgentStateType } from "#agent/state.js";
import { generateAfterInspirationTurnSuggestions } from "../after-turn/inspiration.js";
import { generateAfterOutlineTurnSuggestions } from "../after-turn/outline.js";
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
  const outline = parseOutline(state);
  const afterOutline =
    completed.includes("outline") && hasOutlineContent(outline);

  const turnNextStepSuggestions = afterOutline
    ? await generateAfterOutlineTurnSuggestions(state)
    : await generateAfterInspirationTurnSuggestions(state);
  return { turnNextStepSuggestions };
}
