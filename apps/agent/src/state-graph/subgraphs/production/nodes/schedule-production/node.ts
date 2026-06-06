/**
 * 制作子图节点：制定内部制作计划。
 * 将可执行的作品方案拆为 pending_tasks 与部门分工。
 */
import { HumanMessage } from "@langchain/core/messages";

import { invokeStructured } from "#agent/llm/invoke/index.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import {
  profileSummary,
  productionPlanSummary,
  referencesSummary,
} from "@yougan/domain";
import { YOUGAN_USER_LABEL } from "#agent/system-prompt.js";
import { departmentsBrief } from "../spawn-specialist/helpers/department-brief.js";
import { resolveIndustryContext } from "../llm-call/prompt.js";
import {
  isPlanReady,
  isProfileActionable,
  newProductionPlanTask,
  resolveContentSpecFromProfile,
  type ProductionDepartment,
  type WorkProductionPlan,
} from "@yougan/domain";
import {
  getProductionPlan,
  getProfile,
} from "#agent/state-io/index.js";
import { patchPendingProductionPlan } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";
import {
  ProductionPlanResponseSchema,
  type ProductionPlanResponse,
} from "./schema.js";

function shouldRunScheduleProduction(
  state: AgentStateType,
  force = false,
): boolean {
  const profile = getProfile(state);
  if (!isProfileActionable(profile)) return false;

  if (force) return true;
  const plan = getProductionPlan(state);
  if (isPlanReady(plan) && plan.pending_tasks.length > 0) return false;
  if (!isPlanReady(plan)) return true;
  if (plan.pending_tasks.length === 0 && !plan.executed_tasks.length) {
    return true;
  }
  return false;
}

function buildScheduleProductionPrompt(state: AgentStateType): string {
  const profile = getProfile(state);
  const plan = getProductionPlan(state);
  const contentProfile = resolveContentSpecFromProfile(profile);
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

export async function rescheduleProductionPlan(
  state: AgentStateType,
  options?: { force?: boolean },
): Promise<Partial<AgentStateType>> {
  if (!shouldRunScheduleProduction(state, options?.force)) {
    const profile = getProfile(state);
    const industry = resolveIndustryContext(resolveContentSpecFromProfile(profile));
    const plan = getProductionPlan(state);
    if (plan.industry_context === industry) {
      return {};
    }
    return patchPendingProductionPlan(state, {
      ...plan,
      industry_context: industry,
    });
  }

  const profile = getProfile(state);
  const industry = resolveIndustryContext(resolveContentSpecFromProfile(profile));
  const existing = getProductionPlan(state);
  const llm = createChatModel({ temperature: 0.5 });

  try {
    const parsed = (await invokeStructured(
      llm,
      ProductionPlanResponseSchema,
      [new HumanMessage(buildScheduleProductionPrompt(state))],
      { name: "production_plan" },
    )) as ProductionPlanResponse;

    const plan = applyProductionPlan(existing, parsed);
    plan.industry_context = industry;

    return patchPendingProductionPlan(state, plan);
  } catch {
    const fallbackTasks = [
      newProductionPlanTask("撰写标题与正文", "writing"),
      newProductionPlanTask("规划话题标签与钩子", "writing"),
    ];
    return patchPendingProductionPlan(state, {
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

export async function scheduleProductionNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  return rescheduleProductionPlan(state);
}

export { shouldRunScheduleProduction };
