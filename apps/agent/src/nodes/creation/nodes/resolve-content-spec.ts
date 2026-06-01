import { resolveContentSpec } from "../../../lib/content-spec.js";
import { parseProfile } from "../../../lib/parse-agent-state.js";
import type { AgentStateType } from "../../../state.js";

export async function resolveContentSpecNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const profile = resolveContentSpec(parseProfile(state));
  return { profile };
}
