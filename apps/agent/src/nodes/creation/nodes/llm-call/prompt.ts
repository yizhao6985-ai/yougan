/** 创作模式 LLM：按内部创作计划执行，不对用户暴露 plan 细节 */
import {
  departmentsBrief,
  resolveIndustryContext,
} from "#agent/lib/industry-prompts.js";
import {
  getPlanSummary,
  hasOutlineContent,
  isBlueprintActionable,
  isPlanReady,
} from "#agent/schema.js";
import {
  blueprintSummary,
  productionPlanSummary,
  referencesSummary,
} from "#agent/prompt/context.js";
import { YOUGAN_USER_LABEL } from "#agent/prompt/persona.js";
import { composeSystemPrompt } from "#agent/prompt/system.js";
import { buildFormatGenerationGuidance } from "./prompt-format.js";
import {
  parseBlueprint,
  parseProductionPlan,
  parseProfile,
} from "#agent/lib/parse-agent-state.js";
import type { AgentStateType } from "#agent/state.js";
import type { ContentFormatId, MediaModalityId } from "#agent/lib/content-spec.js";
import { blueprintToContentProfile } from "#agent/lib/blueprint/content-profile.js";

export function buildCreationLlmPrompt(state: AgentStateType): string {
  const blueprint = parseBlueprint(state);
  const profile = parseProfile(state);
  const contentProfile = blueprintToContentProfile(blueprint);
  const plan = parseProductionPlan(state);
  const industry = plan.industry_context ?? resolveIndustryContext(contentProfile);
  const formatHint = buildFormatGenerationGuidance(
    contentProfile.content_format as ContentFormatId | null,
    contentProfile.media_modality as MediaModalityId | null,
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

  const modePrompt = `当前任务：创作执行（制作团队出稿）

前提：使用当前作品方案（见下方）。创意总监已制定内部创作计划（不对${YOUGAN_USER_LABEL}复述计划细节）。

内部分工：
- 文案 → generate_draft / spawn_specialist(writing)
- 设计 → spawn_specialist(design)
- 音频 → spawn_specialist(audio)
- 视频 → spawn_specialist(video)

${formatHint ? `体裁写作要求：${formatHint}` : ""}

行业经验：
${industry}

执行流程（每次${YOUGAN_USER_LABEL}发消息时必须按序）：
1. 若作品方案尚不可执行，引导${YOUGAN_USER_LABEL}继续输入讨论方案，系统会自动进入 blueprint 模式。
2. 若内部计划尚未就绪，等待创意总监编排（勿对用户说「计划」一词，可说「步骤排好了」）。
3. 将${YOUGAN_USER_LABEL}本条诉求作为新任务 → add_plan_task（可指定 department）。
4. 按部门调用 generate_draft 或 spawn_specialist。
5. 执行完成后 complete_execution(summary)。
6. 整体方向变化 → revise_production_plan。

禁止跳过 add_plan_task 直接生成；禁止向${YOUGAN_USER_LABEL}展示任务列表或部门分工细节。

${blueprintSummary(blueprint)}

${referencesSummary(profile)}

内部计划摘要：${getPlanSummary(plan) ?? "（待定）"}
创意总监备注：${plan.director_notes ?? "无"}

部门说明：
${deptBlock}

当前待执行任务：
${pendingBlock}

${productionPlanSummary(plan)}`;

  let gate = "";
  if (!hasOutlineContent(blueprint)) {
    gate = `\n\n⚠ 尚无内容节拍，请引导${YOUGAN_USER_LABEL}继续输入讨论作品方案。`;
  } else if (!isBlueprintActionable(blueprint)) {
    gate = `\n\n⚠ 作品方案尚缺创作主题或内容节拍，请引导${YOUGAN_USER_LABEL}补全方案。`;
  } else if (!isPlanReady(plan)) {
    gate = `\n\n⚠ 内部计划编排中，完成后跟${YOUGAN_USER_LABEL}说「可以开始了」。`;
  }

  return composeSystemPrompt(modePrompt + gate);
}
