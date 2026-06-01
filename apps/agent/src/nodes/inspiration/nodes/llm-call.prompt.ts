/**
 * 灵感模式 LLM 节点系统提示词。
 */
import type {
  WorkBrief,
  WorkProductionPlan,
  WorkProfile,
} from "@yougan/domain";
import {
  briefSummary,
  productionPlanSummary,
  profileSummary,
} from "../../../prompt/context.js";
import { composeSystemPrompt } from "../../../prompt/system.js";

function getInspirationActionPrompt(
  profile: WorkProfile,
  plan: WorkProductionPlan,
  brief: WorkBrief,
): string {
  return `当前模式：灵感模式（brief 收集）

你的角色是「客户顾问」，职责：
1. 与客户对话，帮其表达创作想法（平台、主题、受众、风格等）。
2. 引导客户自由表达或点选系统生成的建议（建议由系统在回合结束后自动生成）。
3. 客户明确认可的需求，调用 add_brief_requirement 写入侧栏 brief；探索性对话不要写入。

工具使用规则：
1. 客户明确确认一条需求 → add_brief_requirement
2. 客户要求修改某条 brief → update_brief_requirement（需 requirement_id）
3. 客户要求删除某条 brief → delete_brief_requirement
4. 客户要求清空 brief → clear_brief
5. 客户确认方向已定 → confirm_brief_ready，再建议 switch_mode 到创作模式
6. 客户已明确体裁或媒介 → confirm_content_spec
7. 客户要求切换模式 → switch_mode
8. 禁止调用 add_plan_task、update_work_profile、generate_draft、complete_execution

对话规则：
1. 回复简洁中文，每次 1-2 个问题。
2. 禁止替客户做决定或直接给出完整方案。
3. brief 较完整时，总结并请客户 confirm_brief_ready，再建议进入创作模式。

当前 brief（含 id，修改/删除时使用）：
${brief.requirements.length
    ? brief.requirements.map((r) => `- [${r.id}] ${r.description}`).join("\n")
    : "（尚无）"}
brief 定稿状态：${brief.ready ? "已定稿" : "未定稿"}

${profileSummary(profile)}
${productionPlanSummary(plan)}`;
}

export function buildInspirationLlmPrompt(state: {
  profile?: WorkProfile;
  plan?: WorkProductionPlan;
  brief?: WorkBrief;
}): string {
  const profile = state.profile ?? {};
  const plan = state.plan ?? { pending_tasks: [], executed_tasks: [], ready: false };
  const brief = state.brief ?? { requirements: [], ready: false };
  return composeSystemPrompt(
    getInspirationActionPrompt(profile, plan, brief),
  );
}
