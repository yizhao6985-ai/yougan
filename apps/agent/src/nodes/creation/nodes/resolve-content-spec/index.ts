import { resolveContentSpec } from "#agent/lib/content-spec.js"
import { parseProfile } from "#agent/lib/parse-agent-state.js"
import type { AgentStateType } from "#agent/state.js"

export async function resolveContentSpecNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const profile = resolveContentSpec(parseProfile(state));
  return { profile };
}
