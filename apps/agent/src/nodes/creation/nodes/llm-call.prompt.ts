/** 创作模式 LLM 节点系统提示词：制作团队按创意总监计划执行 */
import { resolveContentSpec } from "../../../lib/content-spec.js";
import {
  departmentsBrief,
  resolveIndustryContext,
} from "../../../lib/industry-prompts.js";
import { getPlanSummary, isPlanReady } from "../../../schema.js";
import { productionPlanSummary, profileSummary } from "../../../prompt/context.js";
import { YOUGAN_USER_LABEL } from "../../../prompt/persona.js";
import { composeSystemPrompt } from "../../../prompt/system.js";
import { buildFormatGenerationGuidance } from "./llm-call.prompt-format.js";
import { parseProductionPlan, parseProfile } from "../../../lib/parse-agent-state.js";
import type { AgentStateType } from "../../../state.js";
import type { ContentFormatId, MediaModalityId } from "../../../lib/content-spec.js";

export function buildCreationLlmPrompt(state: AgentStateType): string {
  const profile = resolveContentSpec(parseProfile(state));
  const plan = parseProductionPlan(state);
  const summary = profileSummary(profile);
  const industry = plan.industry_context ?? resolveIndustryContext(profile);
  const formatHint = buildFormatGenerationGuidance(
    profile.content_format as ContentFormatId | null,
    profile.media_modality as MediaModalityId | null,
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

  const modePrompt = `当前模式：创作模式（制作团队执行）

内部分工（不要原样说给${YOUGAN_USER_LABEL}听）：
- 制作计划已定稿（见下方），你负责协调文案/设计/音频/视频完成交付
- 文案 → generate_draft / spawn_specialist(writing)
- 设计 → spawn_specialist(design)
- 音频 → spawn_specialist(audio)
- 视频 → spawn_specialist(video)

${formatHint ? `体裁写作要求：${formatHint}` : ""}

行业经验（动态加载）：
${industry}

执行流程（每次${YOUGAN_USER_LABEL}发消息时必须按序）：
1. 若制作计划尚未定稿（plan.ready 为 false），提醒${YOUGAN_USER_LABEL}稍等，内部先完成计划编排。
2. 先将${YOUGAN_USER_LABEL}本条消息作为新任务，调用 add_plan_task（可指定 department）。
3. 根据待执行任务与已定稿计划，调用 update_work_profile（如需要），再按部门调用：
   - 文案任务 → generate_draft
   - 其他部门 → spawn_specialist(department, brief)
4. 执行完成后调用 complete_execution(summary)。
5. ${YOUGAN_USER_LABEL}要求调整整体方向 → 调用 revise_production_plan。
6. ${YOUGAN_USER_LABEL}要求切换模式 → switch_mode。

禁止跳过 add_plan_task 直接生成；禁止执行后不调用 complete_execution。

制作计划摘要：${getPlanSummary(plan) ?? "（待定）"}
创意总监备注：${plan.director_notes ?? "无"}

部门说明：
${deptBlock}

已执行特征基线：${summary}

当前待执行任务：
${pendingBlock}

${productionPlanSummary(plan)}`;

  const planReadyHint = isPlanReady(plan)
    ? ""
    : `\n\n⚠ 制作计划未定稿，先完成内部计划编排，再跟${YOUGAN_USER_LABEL}说「步骤排好了，咱们开始」。`;

  return composeSystemPrompt(modePrompt + planReadyHint);
}
