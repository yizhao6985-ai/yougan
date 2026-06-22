/** 设计执行者：产出文生图 prompt + 短说明 */
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
import { readyTasksSnippet } from "../../execute-writing/helpers/produce-task.js";
import {
  buildDesignTaskHumanPrompt,
  buildDesignTaskSystemPrompt,
} from "../prompt.js";
import {
  DesignDeliverablePayloadSchema,
  type DesignDeliverablePayload,
} from "../schema.js";

export async function produceDesignTask(
  state: AgentStateType,
  config?: LangGraphRunnableConfig,
): Promise<AgentStatePatch> {
  const plan = getProduction(state);
  const task = currentActiveTask(plan);
  if (
    !task ||
    task.department !== "design" ||
    !taskNeedsProduce(task) ||
    isTaskReady(task)
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
    executorLabel: "设计执行者",
  };

  let payload: DesignDeliverablePayload;
  try {
    payload = await invokeStructured(
      llm,
      DesignDeliverablePayloadSchema,
      [
        new SystemMessage(
          buildDesignTaskSystemPrompt({
            profile,
            references,
            userRequirements: plan.summary ?? null,
          }),
        ),
        new HumanMessage(buildDesignTaskHumanPrompt(promptInput)),
      ],
      { name: "executor_produce_design_task", timeoutMs: LLM_TIMEOUT_MS.production },
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
      body: "illustration, high quality, detailed composition",
      title: null,
      notes: "设计任务执行失败，请重试。",
      negative_prompt: null,
    };
  }

  const pending_tasks = plan.pending_tasks.map((t) =>
    t.id === task.id
      ? {
          ...t,
          status: "in_progress" as const,
          feedback: null,
          deliverable: {
            body: payload.body.trim(),
            title: payload.title ?? null,
            notes: payload.notes?.trim() || null,
            negative_prompt: payload.negative_prompt?.trim() || null,
            images: undefined,
            render_error: null,
          },
        }
      : t,
  );

  return {
    ...patchPendingProductionFields(state, { ...plan, pending_tasks }),
    ...patchAiUsageMetering(state.aiUsage, config),
  };
}
