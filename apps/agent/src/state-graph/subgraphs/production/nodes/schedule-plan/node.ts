/**
 * 制作子图入口：创意总监制定内部制作计划。
 */
import { HumanMessage } from "@langchain/core/messages";

import { invokeStructured } from "#agent/llm/invoke/index.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import {
  profileSummary,
  profileReferencesSummary,
} from "#agent/prompts/profile-summary.js";
import { YOUGAN_USER_LABEL } from "#agent/system-prompt.js";
import {
  type ProductionDepartment,
  type WorkProductionPlan,
} from "@yougan/domain";
import {
  getProductionPlan,
  getProfile,
  getReferences,
  patchPendingProductionPlan,
} from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { departmentsBrief } from "../../helpers/department-brief.js";
import { newPlanTask } from "./helpers/new-plan-task.js";
import { formatPlanSummary } from "./helpers/plan-summary.js";
import { PlanResponseSchema, type PlanResponse } from "./schema.js";

function shouldRunSchedulePlan(
  state: AgentStateType,
  force = false,
): boolean {
  if (force) return true;
  const plan = getProductionPlan(state);
  if (plan.pending_tasks.length > 0) return false;
  return plan.executed_tasks.length === 0;
}

function buildSchedulePlanPrompt(state: AgentStateType): string {
  const profile = getProfile(state);
  const references = getReferences(state);
  const plan = getProductionPlan(state);
  return `你是制作总监（内部角色，不对${YOUGAN_USER_LABEL}直接说话），负责将当前作品方案转化为可执行的**制作计划**。

${YOUGAN_USER_LABEL}已表达开始创作意图；方案可能尚不完整，请基于已有信息与用户意图制定计划。

当前作品方案：
${profileSummary(profile, references)}

${profileReferencesSummary(references)}

当前计划（如有）：
${formatPlanSummary(plan)}

请制定内部制作计划：
1. 根据 delivery.format / modalities 决定制作部门
2. 将方案结构段（如有）与用户意图拆分为具体执行任务，每条指定 department
3. 方案缺项时据体裁与用户消息合理推断，任务覆盖从创意到交付的完整流程

只输出结构化计划，不生成正文。`;
}

function applyPlanResponse(
  existing: WorkProductionPlan,
  response: {
    summary: string;
    director_notes?: string;
    departments: ProductionDepartment[];
    tasks: Array<{ description: string; department: ProductionDepartment }>;
  },
): WorkProductionPlan {
  const tasks = response.tasks.map((t) =>
    newPlanTask(t.description, t.department),
  );
  return {
    ...existing,
    pending_tasks: tasks,
    summary: response.summary,
    departments: response.departments,
    director_notes: response.director_notes ?? null,
    industry_context: existing.industry_context,
  };
}

export async function reschedulePlan(
  state: AgentStateType,
  options?: { force?: boolean },
): Promise<AgentStatePatch> {
  if (!shouldRunSchedulePlan(state, options?.force)) {
    return {};
  }

  const existing = getProductionPlan(state);
  const llm = createChatModel({ temperature: 0.5 });

  try {
    const parsed = (await invokeStructured(
      llm,
      PlanResponseSchema,
      [new HumanMessage(buildSchedulePlanPrompt(state))],
      { name: "production_plan" },
    )) as PlanResponse;

    return patchPendingProductionPlan(state, applyPlanResponse(existing, parsed));
  } catch {
    const fallbackTasks = [
      newPlanTask("完成文字内容初稿", "writing"),
      newPlanTask("提炼标题与核心表达", "writing"),
    ];
    return patchPendingProductionPlan(state, {
      ...existing,
      pending_tasks: fallbackTasks,
      summary: "基础内容制作计划",
      departments: ["writing"],
      director_notes: departmentsBrief(["writing"]),
    });
  }
}

export async function schedulePlanNode(
  state: AgentStateType,
): Promise<AgentStatePatch> {
  return reschedulePlan(state);
}

export { shouldRunSchedulePlan };
