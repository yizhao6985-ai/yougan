import { resolveContentSpecFromProfile, type WorkProfile } from "@yougan/domain";

import { parseProfile } from "#agent/lib/parse-agent-state.js";
import { patchStagingProfile } from "#agent/lib/staging-state.js";
import type { AgentStateType } from "#agent/state.js";

export async function resolveContentSpecNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const existing = parseProfile(state);
  const resolved = resolveContentSpecFromProfile(existing);
  const profile: WorkProfile = {
    ...existing,
    spec: {
      ...existing.spec,
      content_format: resolved.content_format ?? existing.spec.content_format,
      media_modalities:
        resolved.media_modalities ?? existing.spec.media_modalities,
      content_type: resolved.content_type ?? existing.spec.content_type,
    },
  };
  return patchStagingProfile(state, profile);
}
