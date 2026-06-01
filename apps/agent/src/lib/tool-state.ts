/**
 * LangGraph tool 内读取与更新 state 的辅助函数。
 */
import { getCurrentTaskInput } from "@langchain/langgraph";

import { parseProfile } from "./parse-agent-state.js";
import type { AgentStateType } from "../state.js";
import type { WorkProfile } from "../schema.js";

export function getState(): AgentStateType {
  return getCurrentTaskInput() as AgentStateType;
}

export function updateProfile(
  state: AgentStateType,
  updates: Partial<WorkProfile>,
): WorkProfile {
  return { ...parseProfile(state), ...updates };
}

export function mergeProfileReferences(
  profile: WorkProfile,
  refs: WorkProfile["references"],
): WorkProfile {
  return {
    ...profile,
    references: [...(profile.references ?? []), ...(refs ?? [])],
  };
}
