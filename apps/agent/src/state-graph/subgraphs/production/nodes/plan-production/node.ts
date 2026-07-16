/**
 * 制作子图入口：每次进入均从零重置 production，再制定新计划。
 */
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";
import type { NodeError } from "@langchain/langgraph";

import { invokeStructured } from "#agent/llm/invoke/index.js";
import { patchAiUsageMetering } from "#agent/llm/invoke/metering.js";
import { createChatModel } from "#agent/llm/providers/index.js";
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
import { patchRunProgress } from "#agent/state-io/run-progress.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { rethrowUnlessRecoverable } from "../../../../helpers/recoverable-node-error.js";
import { captureUserRequirements } from "./helpers/capture-user-requirements.js";
import { newPlanTask } from "./helpers/new-plan-task.js";
import {
  sanitizePlanTasks,
  type PlanTaskInput,
} from "./helpers/sanitize-plan-tasks.js";
import {
  buildPlanProductionHumanPrompt,
  buildPlanProductionSystemPrompt,
} from "./prompt.js";
import { PlanResponseSchema, type PlanResponse } from "./schema.js";

function applyPlanTasks(
  base: WorkProduction,
  tasks: PlanTaskInput[],
): WorkProduction {
  return {
    ...base,
    pending_tasks: tasks.map((t) =>
      newPlanTask(t.description, t.department, {
        direction: t.direction,
        acceptance_criteria: t.acceptance_criteria,
      }),
    ),
  };
}

function fallbackProductionPlan(
  state: AgentStateType,
  config?: RunnableConfig,
): AgentStatePatch {
  const userRequirements = captureUserRequirements(state);
  const fresh: WorkProduction = {
    ...EMPTY_WORK_PRODUCTION,
    summary: userRequirements,
  };
  const pending_tasks = sanitizePlanTasks([]).map((t) =>
    newPlanTask(t.description, t.department as ProductionDepartment, {
      direction: t.direction,
      acceptance_criteria: t.acceptance_criteria,
    }),
  );
  return {
    ...patchRunProgress("production"),
    ...patchPendingProduction(state, {
      ...fresh,
      pending_tasks,
    }),
    ...patchAiUsageMetering(state.aiUsage, config),
  };
}

async function planTasksWithLlm(
  state: AgentStateType,
  userRequirements: string,
  config?: RunnableConfig,
): Promise<PlanTaskInput[]> {
  const profile = getProfile(state);
  const references = getReferences(state);
  const llm = createChatModel({ temperature: 0.5 });

  const parsed = (await invokeStructured(
    llm,
    PlanResponseSchema,
    [
      new SystemMessage(
        buildPlanProductionSystemPrompt({
          profile,
          references,
          userRequirements,
        }),
      ),
      new HumanMessage(buildPlanProductionHumanPrompt()),
    ],
    { name: "production_plan" },
    config,
  )) as PlanResponse;

  return sanitizePlanTasks(parsed.tasks);
}

export async function planProductionNode(
  state: AgentStateType,
  config?: RunnableConfig,
): Promise<AgentStatePatch> {
  const userRequirements = captureUserRequirements(state);
  const fresh: WorkProduction = {
    ...EMPTY_WORK_PRODUCTION,
    summary: userRequirements,
  };
  const tasks = await planTasksWithLlm(state, userRequirements, config);

  return {
    ...patchRunProgress("production"),
    ...patchPendingProduction(state, applyPlanTasks(fresh, tasks)),
    ...patchAiUsageMetering(state.aiUsage, config),
  };
}

export function planProductionErrorHandler(
  state: AgentStateType,
  error: NodeError,
): AgentStatePatch {
  rethrowUnlessRecoverable(error);
  return fallbackProductionPlan(state);
}
