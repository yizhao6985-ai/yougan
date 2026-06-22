/** 执行者（executeWriting / executeDesign）单任务产出逻辑 */
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { LangGraphRunnableConfig } from "@langchain/langgraph";

import { invokeStructured } from "#agent/llm/invoke/index.js";
import {
  isLlmTimeoutError,
  LLM_TIMEOUT_FAILURE_MESSAGE,
  LLM_TIMEOUT_MS,
} from "#agent/llm/invoke/timeout.js";
import { patchAiUsageMetering } from "#agent/llm/invoke/metering.js";
import { createProductionChatModel } from "#agent/llm/providers/index.js";
import type { ProductionDepartment } from "@yougan/domain";
import {
  getModelTemperature,
  getProduction,
  getProfile,
  getReferences,
  patchPendingProductionFields,
} from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { markActiveTaskFailed } from "../../../helpers/mark-task-failed.js";
import { resolveProductionMaxTokens } from "../../../helpers/resolve-production-max-tokens.js";
import {
  currentActiveTask,
  isTaskReady,
  taskNeedsProduce,
} from "../../../helpers/task-plan.js";
import {
  buildProduceTaskHumanPrompt,
  buildProduceTaskSystemPrompt,
} from "../prompt.js";
import {
  TaskDeliverablePayloadSchema,
  type TaskDeliverablePayload,
} from "../schema.js";

export type ProductionExecutorId = "executeWriting" | "executeDesign";

export function executorNodeForTask(
  task: { department?: ProductionDepartment } | undefined,
): ProductionExecutorId {
  return task?.department === "design" ? "executeDesign" : "executeWriting";
}

export function readyTasksSnippet(
  state: AgentStateType,
  excludeTaskId: string,
): string {
  const plan = getProduction(state);
  const lines: string[] = [];
  for (const task of plan.pending_tasks) {
    if (task.id === excludeTaskId || !isTaskReady(task)) continue;
    const body = task.deliverable?.body?.trim();
    if (!body) continue;
    lines.push(`- [${task.description}] ${body.slice(0, 400)}`);
  }
  return lines.join("\n");
}

const EXECUTOR_LABELS: Record<ProductionExecutorId, string> = {
  executeWriting: "文案执行者",
  executeDesign: "设计执行者",
};

export async function produceNextTask(
  state: AgentStateType,
  executor: ProductionExecutorId,
  config?: LangGraphRunnableConfig,
): Promise<AgentStatePatch> {
  const plan = getProduction(state);
  const task = currentActiveTask(plan);
  if (
    !task ||
    executorNodeForTask(task) !== executor ||
    !taskNeedsProduce(task)
  ) {
    return {};
  }

  const profile = getProfile(state);
  const references = getReferences(state);
  const llm = createProductionChatModel({
    temperature: getModelTemperature(state),
    maxTokens: resolveProductionMaxTokens(profile),
  });
  const promptInput = {
    profile,
    references,
    task,
    userRequirements: plan.summary ?? null,
    readySnippet: readyTasksSnippet(state, task.id),
    executorLabel: EXECUTOR_LABELS[executor],
  };

  let payload: TaskDeliverablePayload;

  try {
    payload = await invokeStructured(
      llm,
      TaskDeliverablePayloadSchema,
      [
        new SystemMessage(buildProduceTaskSystemPrompt(promptInput)),
        new HumanMessage(buildProduceTaskHumanPrompt(promptInput)),
      ],
      { name: "executor_produce_task", timeoutMs: LLM_TIMEOUT_MS.production },
      config,
    );
  } catch (error) {
    if (isLlmTimeoutError(error)) {
      return {
        ...markActiveTaskFailed(state, task.id, LLM_TIMEOUT_FAILURE_MESSAGE),
        ...patchAiUsageMetering(state.aiUsage, config),
      };
    }
    payload = {
      body: "任务执行失败，请重试。",
      title: null,
      notes: null,
    };
  }

  const pending_tasks = plan.pending_tasks.map((t) =>
    t.id === task.id
      ? {
          ...t,
          status: "in_progress" as const,
          feedback: null,
          deliverable: {
            body: payload.body,
            title: payload.title ?? null,
            notes: payload.notes ?? null,
          },
        }
      : t,
  );

  return {
    ...patchPendingProductionFields(state, { ...plan, pending_tasks }),
    ...patchAiUsageMetering(state.aiUsage, config),
  };
}
