/**
 * LangGraph tool 内读取与更新 state 的辅助函数。
 */
import { getCurrentTaskInput } from "@langchain/langgraph";

import { appendProfileReferences } from "@yougan/domain";

import { parseProfile, parseReferences } from "./parse-agent-state.js";
import type { AgentStateType } from "#agent/state.js";
import type { ReferenceItem } from "#agent/schema.js";
import type { WorkProfile } from "#agent/schema.js";

export function getState(): AgentStateType {
  return getCurrentTaskInput() as AgentStateType;
}

export function appendReferences(
  state: AgentStateType,
  refs: ReferenceItem[],
): WorkProfile {
  return appendProfileReferences(parseProfile(state), refs);
}
