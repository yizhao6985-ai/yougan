/** 文案管线 LLM 系统提示词 */
import {
  getPlanSummary,
  resolveDeliveryFromProfile,
  type ContentFormatId,
} from "@yougan/domain";
import {
  profileSummary,
  profileReferencesSummary,
} from "#agent/prompts/profile-summary.js";
import {
  composeSystemPrompt,
  YOUGAN_USER_LABEL,
} from "#agent/system-prompt.js";
import {
  getProductionPlan,
  getProfile,
  getReferences,
} from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

import { departmentsBrief } from "../../helpers/department-brief.js";
import { buildFormatGenerationGuidance } from "../../helpers/format-guidance.js";
import { formatPlanSummary } from "../schedule-plan/helpers/plan-summary.js";

export function buildDirectWritingPrompt(state: AgentStateType): string {
  const profile = getProfile(state);
  const references = getReferences(state);
  const delivery = resolveDeliveryFromProfile(profile);
  const plan = getProductionPlan(state);
  const formatHint = buildFormatGenerationGuidance(
    delivery.format as ContentFormatId | null,
    delivery.modalities?.[0] ?? null,
  );

  const pendingBlock = plan.pending_tasks.length
    ? plan.pending_tasks
        .map(
          (c) =>
            `- [${c.department ?? "writing"}] ${c.description}${c.assignee ? `（@${c.assignee}）` : ""}`,
        )
        .join("\n")
    : "（无）";

  const deptBlock = plan.departments?.length
    ? departmentsBrief(plan.departments)
    : "文案部";

  const modePrompt = `当前任务：制作执行（制作团队出稿）

前提：使用当前作品方案（见下方，可能尚不完整）。制作总监已制定内部制作计划（不对${YOUGAN_USER_LABEL}复述计划细节）。

${formatHint ? `体裁与媒介要求：${formatHint}` : ""}

执行流程（每次${YOUGAN_USER_LABEL}发消息时必须按序）：
1. 基于现有方案与用户消息直接推进出稿；关键信息缺失时在对话中向${YOUGAN_USER_LABEL}追问，勿因方案不完整而拒绝执行。
2. 若待执行任务尚为空，等待制作总监编排（勿对用户说「计划」一词，可说「步骤排好了」）。
3. add_plan_task → 按部门执行 → complete_execution。
4. 整体方向变化 → revise_production_plan。

禁止跳过 add_plan_task 直接生成；禁止向${YOUGAN_USER_LABEL}展示任务列表或部门分工细节。

${profileSummary(profile, references)}

${profileReferencesSummary(references)}

内部计划摘要：${getPlanSummary(plan) ?? "（待定）"}
创意总监备注：${plan.director_notes ?? "无"}

部门说明：
${deptBlock}

当前待执行任务：
${pendingBlock}

${formatPlanSummary(plan)}`;

  return composeSystemPrompt(modePrompt);
}
