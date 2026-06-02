/**
 * 提问模式 LLM 节点系统提示词。
 */
import type { WorkBrief, WorkOutline, WorkProfile } from "../../../schema.js";
import {
  briefSummary,
  outlineSummary,
  profileSummary,
} from "../../../prompt/context.js";
import { resolveIndustryContext } from "../../../lib/industry-prompts.js";
import { YOUGAN_USER_LABEL } from "../../../prompt/persona.js";
import { composeSystemPrompt } from "../../../prompt/system.js";

export function buildAskLlmPrompt(state: {
  profile?: WorkProfile;
  outline?: WorkOutline;
  brief?: WorkBrief;
}): string {
  const profile = state.profile ?? {};
  const outline = state.outline ?? { sections: [], ready: false };
  const brief = state.brief ?? { requirements: [], ready: false };
  const industry = resolveIndustryContext(profile);

  const modePrompt = `当前任务：提问答疑（不执行制作）

工具规则：
1. 明确写入 brief → add_brief_from_ask
2. 禁止 add_plan_task、generate_draft、complete_execution、revise_production_plan
3. 禁止修改大纲（引导继续输入，编排会安排后续任务）

brief：
${briefSummary(brief)}

内容大纲：
${outlineSummary(outline)}

作品特征：
${profileSummary(profile)}

行业参考：
${industry}`;

  return composeSystemPrompt(modePrompt);
}
