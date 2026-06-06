/** 从 profile 推导并写回 content_format / media_modalities 等规格 */
import { resolveContentSpecFromProfile, type WorkProfile } from "@yougan/domain";

import { getProfile } from "#agent/state-io/index.js";
import { patchPendingProfile } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

export async function resolveContentSpecNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const existing = getProfile(state);
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
  return patchPendingProfile(state, profile);
}
