import { isEmptyThread } from "../../conditional-edges/route-by-entry.js";
import type { BriefSuggestions } from "../../schema.js";
import type { AgentStateType } from "../../state.js";
import { generateAfterInspirationBriefSuggestions } from "./after-inspiration-turn.js";
import { generateOpeningBriefSuggestions } from "./opening.js";

export async function runUpdateBriefSuggestions(
  state: AgentStateType,
): Promise<{ briefSuggestions: BriefSuggestions | null }> {
  if (isEmptyThread(state)) {
    const briefSuggestions = await generateOpeningBriefSuggestions(state);
    return { briefSuggestions };
  }

  const briefSuggestions = await generateAfterInspirationBriefSuggestions(state);
  return { briefSuggestions };
}
