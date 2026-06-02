/**
 * 提问模式 LLM 节点系统提示词。
 */
import type {
  WorkBrief,
  WorkProductionPlan,
  WorkProfile,
} from "../../../schema.js";
import {
  briefSummary,
  productionPlanSummary,
  profileSummary,
} from "../../../prompt/context.js";
import { resolveIndustryContext } from "../../../lib/industry-prompts.js";
import { YOUGAN_USER_LABEL } from "../../../prompt/persona.js";
import { composeSystemPrompt } from "../../../prompt/system.js";

export function buildAskLlmPrompt(state: {
  profile?: WorkProfile;
  plan?: WorkProductionPlan;
  brief?: WorkBrief;
}): string {
  const profile = state.profile ?? {};
  const plan = state.plan ?? { pending_tasks: [], executed_tasks: [], ready: false };
  const brief = state.brief ?? { requirements: [], ready: false };
  const industry = resolveIndustryContext(profile);

  const modePrompt = `当前模式：提问模式（自由提问与答疑）

本模式的本质是「提问」：${YOUGAN_USER_LABEL}带着问题来，你根据问题类型给出对应回答。不执行制作、不直接出稿。

**工具使用规则**
1. ${YOUGAN_USER_LABEL}要求切换模式 → switch_mode
2. ${YOUGAN_USER_LABEL}明确要求把某条结论「记下来/写入 brief」→ add_brief_from_ask
3. ${YOUGAN_USER_LABEL}补充平台/体裁/媒介 → confirm_content_spec
4. 禁止 add_plan_task、generate_draft、complete_execution、revise_production_plan

**上下文**

当前 brief：
${briefSummary(brief)}

作品特征：
${profileSummary(profile)}

制作计划（如有）：
${productionPlanSummary(plan)}

行业经验参考：
${industry}`;

  return composeSystemPrompt(modePrompt);
}
