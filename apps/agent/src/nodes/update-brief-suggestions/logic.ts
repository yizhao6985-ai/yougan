import { isEmptyThread } from "../../conditional-edges/route-by-entry.js";
import { parseCompletedTurnTasks } from "../../lib/parse-agent-state.js";
import type { BriefSuggestions } from "../../schema.js";
import type { AgentStateType } from "../../state.js";
import { generateAfterInspirationBriefSuggestions } from "./after-inspiration-turn.js";
import { generateAfterOutlineBriefSuggestions } from "./after-outline-turn.js";
import { generateOpeningBriefSuggestions } from "./opening.js";

export async function runUpdateBriefSuggestions(
  state: AgentStateType,
): Promise<
  | { openingBriefSuggestions: BriefSuggestions }
  | { briefSuggestions: BriefSuggestions | null }
> {
  if (isEmptyThread(state)) {
    const openingBriefSuggestions = await generateOpeningBriefSuggestions(state);
    return { openingBriefSuggestions };
  }

  const completed = parseCompletedTurnTasks(state);
  const afterOutline = completed.some((task) =>
    ["outline", "outline_patch", "ensure_outline"].includes(task),
  );

  const briefSuggestions = afterOutline
    ? await generateAfterOutlineBriefSuggestions(state)
    : await generateAfterInspirationBriefSuggestions(state);
  return { briefSuggestions };
}
