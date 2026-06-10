/** ask 子图 LLM 系统提示词（纯答疑，不改方案与成稿） */
import { resolveDeliveryFromProfile } from "@yougan/domain";
import {
  profileSummary,
  profileReferencesSummary,
} from "#agent/prompts/profile-summary.js";
import {
  composeSystemPrompt,
  YOUGAN_USER_LABEL,
} from "#agent/system-prompt.js";
import { getProfile, getReferences } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";
import { resolveIndustryContext } from "../../../production/nodes/llm-call/prompt.js";

export function buildAskPrompt(state: AgentStateType): string {
  const profile = getProfile(state);
  const references = getReferences(state);
  const industry = resolveIndustryContext(resolveDeliveryFromProfile(profile));

  const modePrompt = `当前任务：提问答疑（不执行制作，不修改作品方案）

规则：
1. 优先基于作品方案与已有知识回答；需要实时信息或外部事实核查时再联网搜索
2. 若${YOUGAN_USER_LABEL}明确要求把结论写入作品方案（改主题、节拍、要求、定位等），在回复中说明「可以说清楚要改什么，我会帮你更新方案」，由 workflowTurn 进入 profile 处理
3. 禁止代为修改方案结构或触发制作

作品方案（只读参考）：
${profileSummary(profile, references)}

${profileReferencesSummary(references)}

行业参考：
${industry}`;

  return composeSystemPrompt(modePrompt);
}
