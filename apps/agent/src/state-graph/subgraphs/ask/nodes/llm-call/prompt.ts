/** ask 子图 LLM 系统提示词（答疑，不改方案结构工具） */
import {
  profileSummary,
  referencesSummary,
  resolveContentSpecFromProfile,
} from "@yougan/domain";
import { composeSystemPrompt } from "#agent/system-prompt.js";
import { getProfile } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";
import { resolveIndustryContext } from "../../../production/nodes/llm-call/prompt.js";

export function buildAskPrompt(state: AgentStateType): string {
  const profile = getProfile(state);
  const industry = resolveIndustryContext(resolveContentSpecFromProfile(profile));

  const modePrompt = `当前任务：提问答疑（不执行制作）

工具规则：
1. 明确写入作品方案 → add_profile_constraint_from_ask
2. 禁止 add_plan_task、generate_draft、complete_execution、revise_production_plan
3. 禁止直接改方案结构（引导继续输入，编排会安排 profile 任务）

作品方案：
${profileSummary(profile)}

${referencesSummary(profile.references)}

行业参考：
${industry}`;

  return composeSystemPrompt(modePrompt);
}
