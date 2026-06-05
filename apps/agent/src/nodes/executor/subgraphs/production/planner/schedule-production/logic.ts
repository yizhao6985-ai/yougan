/**
 * 制作计划编排：根据作品方案制定内部制作计划。
 */
import { HumanMessage } from "@langchain/core/messages";

import { createStructuredModel } from "#agent/llm/dashscope.js";
import { invokeStructuredOutput } from "#agent/lib/structured-output.js";
import {
  profileSummary,
  productionPlanSummary,
  referencesSummary,
} from "#agent/prompt/context.js";
import { YOUGAN_USER_LABEL } from "#agent/prompt/persona.js";
import {
  departmentsBrief,
  resolveIndustryContext,
} from "#agent/lib/industry-prompts.js";
import { profileToContentSpec } from "#agent/lib/work-profile/content-profile.js";
import {
  isPlanReady,
  isProfileActionable,
  newProductionPlanTask,
  type ProductionDepartment,
  type WorkProductionPlan,
} from "@yougan/domain";
import {
  parseProductionPlan,
  parseProfile,
} from "#agent/lib/parse-agent-state.js";
import { patchStagingProductionPlan } from "#agent/lib/staging-state.js";
import type { AgentStateType } from "#agent/state.js";
import { ProductionPlanResponseSchema } from "./schema.js";

function shouldRunScheduleProduction(
  state: AgentStateType,
  force = false,
): boolean {
  const profile = parseProfile(state);
  if (!isProfileActionable(profile)) return false;

  if (force) return true;
  const plan = parseProductionPlan(state);
  if (isPlanReady(plan) && plan.pending_tasks.length > 0) return false;
  if (!isPlanReady(plan)) return true;
  if (plan.pending_tasks.length === 0 && !plan.executed_tasks.length) {
    return true;
  }
  return false;
}

function buildScheduleProductionPrompt(state: AgentStateType): string {
  const profile = parseProfile(state);
  const plan = parseProductionPlan(state);
  const contentProfile = profileToContentSpec(profile);
  const industry = resolveIndustryContext(contentProfile);

  return `你是制作总监（内部角色，不对${YOUGAN_USER_LABEL}直接说话），负责将已定稿的作品方案转化为可执行的**制作计划**。

${YOUGAN_USER_LABEL}已确认作品方案：
${profileSummary(profile)}

${referencesSummary(profile.references)}

当前计划（如有）：
${productionPlanSummary(plan)}

行业经验：
${industry}

请制定内部制作计划：
1. 根据 content_format / media_modalities 决定制作部门
2. 将方案节拍拆分为具体执行任务，每条指定 department
3. 任务覆盖从创意到交付的完整流程

只输出结构化计划，不生成正文。`;
}

function applyProductionPlan(
  existing: WorkProductionPlan,
  response: {
    summary: string;
    director_notes?: string;
    departments: ProductionDepartment[];
    tasks: Array<{ description: string; department: ProductionDepartment }>;
  },
): WorkProductionPlan {
  const tasks = response.tasks.map((t) =>
    newProductionPlanTask(t.description, t.department),
  );
  return {
    ...existing,
    pending_tasks: tasks,
    ready: true,
    summary: response.summary,
    departments: response.departments,
    director_notes: response.director_notes ?? null,
    industry_context: existing.industry_context,
  };
}

export async function runScheduleProduction(
  state: AgentStateType,
  options?: { force?: boolean },
): Promise<Partial<AgentStateType>> {
  if (!shouldRunScheduleProduction(state, options?.force)) {
    const profile = parseProfile(state);
    const industry = resolveIndustryContext(profileToContentSpec(profile));
    const plan = parseProductionPlan(state);
    if (plan.industry_context === industry) {
      return {};
    }
    return patchStagingProductionPlan(state, {
      ...plan,
      industry_context: industry,
    });
  }

  const profile = parseProfile(state);
  const industry = resolveIndustryContext(profileToContentSpec(profile));
  const existing = parseProductionPlan(state);
  const llm = createStructuredModel({ temperature: 0.5 });

  try {
    const parsed = await invokeStructuredOutput(
      llm,
      ProductionPlanResponseSchema,
      [new HumanMessage(buildScheduleProductionPrompt(state))],
      { name: "production_plan" },
    );

    const plan = applyProductionPlan(existing, parsed);
    plan.industry_context = industry;

    return patchStagingProductionPlan(state, plan);
  } catch {
    const fallbackTasks = [
      newProductionPlanTask("撰写标题与正文", "writing"),
      newProductionPlanTask("规划话题标签与钩子", "writing"),
    ];
    return patchStagingProductionPlan(state, {
      ...existing,
      pending_tasks: fallbackTasks,
      ready: true,
      summary: "基础文案制作计划",
      departments: ["writing"],
      industry_context: industry,
      director_notes: departmentsBrief(["writing"]),
    });
  }
}

export { shouldRunScheduleProduction };
