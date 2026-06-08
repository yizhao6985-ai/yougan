/** 从 profile 推导并写回 delivery.format / modalities */
import {
  patchDelivery,
  resolveDeliveryFromProfile,
} from "@yougan/domain";

import { getProfile } from "#agent/state-io/index.js";
import { patchPendingProfile } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

export async function resolveContentSpecNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const existing = getProfile(state);
  const resolved = resolveDeliveryFromProfile(existing);
  return patchPendingProfile(
    state,
    patchDelivery(existing, {
      format: resolved.format,
      modalities: resolved.modalities,
      category: resolved.category,
    }),
  );
}
