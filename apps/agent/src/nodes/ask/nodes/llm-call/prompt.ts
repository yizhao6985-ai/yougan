/**
 * 提问模式 LLM 节点系统提示词。
 */
import type { WorkBlueprint, WorkProfile } from "#agent/schema.js";
import {
  blueprintSummary,
  referencesSummary,
} from "#agent/prompt/context.js";
import { resolveIndustryContext } from "#agent/lib/industry-prompts.js";
import { YOUGAN_USER_LABEL } from "#agent/prompt/persona.js";
import { composeSystemPrompt } from "#agent/prompt/system.js";
import { blueprintToContentProfile } from "#agent/lib/blueprint/content-profile.js";

export function buildAskLlmPrompt(state: {
  profile?: WorkProfile;
  blueprint?: WorkBlueprint;
}): string {
  const profile = state.profile ?? { references: [] };
  const blueprint = state.blueprint ?? {
    spec: {},
    voice: {},
    premise: "",
    constraints: [],
    beats: [],
  };
  const industry = resolveIndustryContext(blueprintToContentProfile(blueprint));

  const modePrompt = `当前任务：提问答疑（不执行制作）

工具规则：
1. 明确写入作品方案 → add_blueprint_constraint_from_ask
2. 禁止 add_plan_task、generate_draft、complete_execution、revise_production_plan
3. 禁止直接改方案结构（引导继续输入，编排会安排 blueprint 任务）

作品方案：
${blueprintSummary(blueprint)}

${referencesSummary(profile)}

行业参考：
${industry}`;

  return composeSystemPrompt(modePrompt);
}
