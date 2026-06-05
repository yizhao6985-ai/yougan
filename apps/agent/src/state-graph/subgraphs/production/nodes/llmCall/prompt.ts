/** production 文案管线 LLM 系统提示词 */
import {
  departmentsBrief,
} from "../../helpers/department-brief.js";
import { resolveIndustryContext } from "../../../ask/nodes/llmCall/industry.js";
import {
  getPlanSummary,
  isPlanReady,
  isProfileActionable,
  profileSummary,
  productionPlanSummary,
  referencesSummary,
  resolveContentSpecFromProfile,
  type ContentFormatId,
} from "@yougan/domain";
import {
  composeSystemPrompt,
  YOUGAN_USER_LABEL,
} from "#agent/system-prompt.js";
import { buildFormatGenerationGuidance } from "./format-guidance.js";
import {
  parseProductionPlan,
  parseProfile,
} from "#agent/runtime/state-readers.js";
import type { AgentStateType } from "#agent/state.js";

export function buildProductionLlmPrompt(state: AgentStateType): string {
  const profile = parseProfile(state);
  const contentProfile = resolveContentSpecFromProfile(profile);
  const plan = parseProductionPlan(state);
  const industry = plan.industry_context ?? resolveIndustryContext(contentProfile);
  const formatHint = buildFormatGenerationGuidance(
    contentProfile.content_format as ContentFormatId | null,
    contentProfile.media_modalities?.[0] ?? null,
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

前提：使用当前作品方案（见下方）。制作总监已制定内部制作计划（不对${YOUGAN_USER_LABEL}复述计划细节）。

内部分工：
- 文案 → generate_draft / spawn_specialist(writing)
- 设计 → spawn_specialist(design)
- 音频 → spawn_specialist(audio)
- 视频 → spawn_specialist(video)

${formatHint ? `体裁写作要求：${formatHint}` : ""}

行业经验：
${industry}

执行流程（每次${YOUGAN_USER_LABEL}发消息时必须按序）：
1. 进入制作时系统已尝试补全方案缺口；若仍不可执行再引导${YOUGAN_USER_LABEL}补充说明。
2. 若内部计划尚未就绪，等待制作总监编排（勿对用户说「计划」一词，可说「步骤排好了」）。
3. 将${YOUGAN_USER_LABEL}本条诉求作为新任务 → add_plan_task（可指定 department）。
4. 按部门调用 generate_draft 或 spawn_specialist。
5. 执行完成后 complete_execution(summary)。
6. 整体方向变化 → revise_production_plan。

禁止跳过 add_plan_task 直接生成；禁止向${YOUGAN_USER_LABEL}展示任务列表或部门分工细节。

${profileSummary(profile)}

${referencesSummary(profile.references)}

内部计划摘要：${getPlanSummary(plan) ?? "（待定）"}
创意总监备注：${plan.director_notes ?? "无"}

部门说明：
${deptBlock}

当前待执行任务：
${pendingBlock}

${productionPlanSummary(plan)}`;

  let gate = "";
  if (!isProfileActionable(profile)) {
    gate = `\n\n⚠ 作品方案仍缺关键信息，请引导${YOUGAN_USER_LABEL}补充创作主题或结构要点。`;
  } else if (!isPlanReady(plan)) {
    gate = `\n\n⚠ 内部计划编排中，完成后跟${YOUGAN_USER_LABEL}说「可以开始了」。`;
  }

  return composeSystemPrompt(modePrompt + gate);
}
