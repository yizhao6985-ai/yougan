/**
 * 创意总监节点：根据灵感与 profile 制定制作计划（DeepSeek structured output）。
 */
import { HumanMessage } from "@langchain/core/messages";

import { createStructuredModel } from "../../../../llm/dashscope.js";
import { invokeStructuredOutput } from "../../../../lib/structured-output.js";
import {
  inspirationSummary,
  productionPlanSummary,
  profileSummary,
} from "../../../../prompt/context.js";
import {
  departmentsBrief,
  resolveIndustryContext,
} from "../../../../lib/industry-prompts.js";
import {
  isPlanReady,
  newProductionPlanTask,
  type ProductionDepartment,
  type WorkProductionPlan,
} from "../../../../schema.js";
import {
  parseInspiration,
  parseProductionPlan,
  parseProfile,
} from "../../../../lib/parse-agent-state.js";
import type { AgentStateType } from "../../../../state.js";
import { ProductionPlanResponseSchema } from "./schema.js";
import { resolveContentSpec } from "../../../../lib/content-spec.js";

function shouldRunCreativeDirector(
  state: AgentStateType,
  force = false,
): boolean {
  if (force) return true;
  const plan = parseProductionPlan(state);
  if (isPlanReady(plan) && plan.pending_changes.length > 0) return false;
  if (!isPlanReady(plan)) return true;
  if (plan.pending_changes.length === 0 && !plan.executed_changes.length) {
    return true;
  }
  return false;
}

function buildCreativeDirectorPrompt(state: AgentStateType): string {
  const profile = resolveContentSpec(parseProfile(state));
  const inspiration = parseInspiration(state);
  const plan = parseProductionPlan(state);
  const industry = resolveIndustryContext(profile);

  return `你是创意总监，负责为客户作品制定整体制作计划。

客户需求（已确认灵感）：
${inspirationSummary(inspiration)}

作品特征：
${profileSummary(profile)}

当前计划（如有）：
${productionPlanSummary(plan)}

行业经验：
${industry}

请制定制作计划：
1. 根据 content_format / media_modality 决定需要哪些制作部门（writing/design/audio/video）
2. 将计划拆分为具体任务，每条任务指定 department
3. 任务应覆盖从创意到交付的完整流程
4. 文案类任务由 writing 负责；配图方案由 design；口播/播客由 audio；视频脚本由 video

只输出结构化计划，不生成正文。`;
}

function applyProductionPlan(
  existing: WorkProductionPlan,
  response: {
    plan_summary: string;
    creative_director_notes?: string;
    departments: ProductionDepartment[];
    tasks: Array<{ description: string; department: ProductionDepartment }>;
  },
): WorkProductionPlan {
  const tasks = response.tasks.map((t) =>
    newProductionPlanTask(t.description, t.department),
  );
  return {
    ...existing,
    pending_changes: tasks,
    plan_ready: true,
    plan_summary: response.plan_summary,
    departments: response.departments,
    creative_director_notes: response.creative_director_notes ?? null,
    industry_context: existing.industry_context,
  };
}

export async function runCreativeDirector(
  state: AgentStateType,
  options?: { force?: boolean },
): Promise<Partial<AgentStateType>> {
  if (!shouldRunCreativeDirector(state, options?.force)) {
    const profile = resolveContentSpec(parseProfile(state));
    const industry = resolveIndustryContext(profile);
    const plan = parseProductionPlan(state);
    if (plan.industry_context === industry) {
      return {};
    }
    return {
      plan: { ...plan, industry_context: industry },
    };
  }

  const profile = resolveContentSpec(parseProfile(state));
  const industry = resolveIndustryContext(profile);
  const existing = parseProductionPlan(state);
  const llm = createStructuredModel({ temperature: 0.5 });

  try {
    const parsed = await invokeStructuredOutput(
      llm,
      ProductionPlanResponseSchema,
      [new HumanMessage(buildCreativeDirectorPrompt(state))],
      { name: "production_plan" },
    );

    const plan = applyProductionPlan(existing, parsed);
    plan.industry_context = industry;

    return { plan, profile };
  } catch {
    const fallbackTasks = [
      newProductionPlanTask("撰写标题与正文", "writing"),
      newProductionPlanTask("规划话题标签与钩子", "writing"),
    ];
    return {
      plan: {
        ...existing,
        pending_changes: fallbackTasks,
        plan_ready: true,
        plan_summary: "基础文案制作计划",
        departments: ["writing"],
        industry_context: industry,
        creative_director_notes: departmentsBrief(["writing"]),
      },
      profile,
    };
  }
}

export { shouldRunCreativeDirector };
