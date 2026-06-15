import { getLatestHumanMessageText } from "#agent/messages/human.js";
import { getProfile } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

/** 本轮制作的用户要求：进 plan 前写入 production.summary，plan LLM 不覆盖。 */
export function captureUserRequirements(state: AgentStateType): string {
  const fromMessage = getLatestHumanMessageText(state.messages)?.trim();
  if (fromMessage) return fromMessage;

  const profile = getProfile(state);
  const parts = [profile.intent.summary?.trim()].filter(Boolean);
  return parts.join("\n") || "按当前方案完成成稿";
}
