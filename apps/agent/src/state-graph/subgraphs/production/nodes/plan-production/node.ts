/**
 * 制作子图入口：每次进入均从零重置 production，再制定新计划。
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
  EMPTY_WORK_PRODUCTION,
  type ProductionDepartment,
  type WorkProduction,
} from "@yougan/domain";
import {
  getProfile,
  getReferences,
  patchPendingProduction,
} from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import {
  departmentsBrief,
  departmentsFromTasks,
} from "../../helpers/department-brief.js";
import { newPlanTask } from "./helpers/new-plan-task.js";
import { PlanResponseSchema, type PlanResponse } from "./schema.js";

function buildPlanProductionPrompt(state: AgentStateType): string {
  const profile = getProfile(state);
  const references = getReferences(state);
  return `你是制作总监（内部角色，不对${YOUGAN_USER_LABEL}直接说话），负责将当前作品方案转化为可执行的**制作计划**。

${YOUGAN_USER_LABEL}已表达开始创作意图；方案可能尚不完整，请基于已有信息与用户意图制定计划。

当前作品方案：
${profileSummary(profile, references)}

${profileReferencesSummary(references)}

请制定内部制作计划：
1. 根据 delivery.format / modalities 为每条任务指定 department
2. 将方案结构段（如有）与用户意图拆分为具体执行任务
3. 每条任务必须给出 direction（基于 profile 的产出方向指导）与 acceptance_criteria（方向性验收标准）
4. direction 应呼应受众、风格、体裁、结构段与 guardrails；acceptance_criteria 用于验收员判断方向是否达标，不是实现 checklist
5. 方案缺项时据体裁与用户消息合理推断，任务覆盖从创意到交付的完整流程
6. summary 写计划整体摘要与给制作团队的编排说明（合并为一段即可）

只输出结构化计划，不生成正文。`;
}

function applyPlanResponse(
  base: WorkProduction,
  response: {
    summary: string;
    tasks: Array<{
      description: string;
      department: ProductionDepartment;
      direction: string;
      acceptance_criteria: string;
    }>;
  },
): WorkProduction {
  const tasks = response.tasks.map((t) =>
    newPlanTask(t.description, t.department, {
      direction: t.direction,
      acceptance_criteria: t.acceptance_criteria,
    }),
  );
  return {
    ...base,
    pending_tasks: tasks,
    summary: response.summary,
  };
}

async function createProductionPlan(
  state: AgentStateType,
): Promise<AgentStatePatch> {
  const fresh: WorkProduction = { ...EMPTY_WORK_PRODUCTION };
  const llm = createChatModel({ temperature: 0.5 });

  try {
    const parsed = (await invokeStructured(
      llm,
      PlanResponseSchema,
      [new HumanMessage(buildPlanProductionPrompt(state))],
      { name: "production_plan" },
    )) as PlanResponse;

    return patchPendingProduction(state, applyPlanResponse(fresh, parsed));
  } catch {
    const pending_tasks = [
      newPlanTask("完成文字内容初稿", "writing"),
      newPlanTask("提炼标题与核心表达", "writing"),
    ];
    const deptBrief = departmentsBrief(departmentsFromTasks(pending_tasks));
    return patchPendingProduction(state, {
      ...fresh,
      pending_tasks,
      summary: `基础内容制作计划\n${deptBrief}`,
    });
  }
}

export async function planProductionNode(
  state: AgentStateType,
): Promise<AgentStatePatch> {
  return createProductionPlan(state);
}
