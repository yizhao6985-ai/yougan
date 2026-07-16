/** 单任务方向性验收；仅更新任务状态，流转由 routeProduction 负责 */
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";
import { z } from "zod";

import {
  isNodeTimeoutError,
  type NodeError,
} from "@langchain/langgraph";

import { invokeStructured } from "#agent/llm/invoke/index.js";
import {
  LLM_FAILURE_MESSAGE,
  LLM_TIMEOUT_FAILURE_MESSAGE,
} from "#agent/llm/invoke/timeout.js";
import { patchAiUsageMetering } from "#agent/llm/invoke/metering.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import {
  getProduction,
  getProfile,
  getReferences,
  patchPendingProductionFields,
} from "#agent/state-io/index.js";
import {
  productionTaskActivityId,
  upsertTurnActivity,
} from "#agent/state-io/turn-activities.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { rethrowUnlessRecoverable } from "../../../../helpers/recoverable-node-error.js";
import { acceptAttemptsExhausted, MAX_ACCEPT_ATTEMPTS } from "../../helpers/pipeline.js";
import { markActiveTaskFailed } from "../../helpers/mark-task-failed.js";
import {
  defaultTaskGuidance,
  resolveAcceptTaskId,
  taskAwaitingAccept,
} from "../../helpers/task-plan.js";
import { isValidTaskDeliverable } from "./helpers/deliverable.js";
import {
  buildAcceptTaskHumanPrompt,
  buildAcceptTaskSystemPrompt,
} from "./prompt.js";

/** 验收次数已满但状态未标 failed 时兜底，避免 dispatch ↔ route 死循环 */
function reconcileExhaustedInProgressTask(
  state: AgentStateType,
): AgentStatePatch | null {
  const plan = getProduction(state);
  const stuck = plan.pending_tasks.find(
    (t) =>
      t.status === "in_progress" &&
      acceptAttemptsExhausted(t) &&
      !taskAwaitingAccept(t),
  );
  if (!stuck) return null;

  return markActiveTaskFailed(
    state,
    stuck.id,
    stuck.failure_message?.trim() ||
      `任务「${stuck.description}」验收已达上限仍未通过，已终止。`,
  );
}

const AcceptResultSchema = z.object({
  passed: z.boolean().describe("是否通过方向性验收"),
  feedback: z.string().describe("未通过时的具体修改建议；通过时可简短肯定"),
});

export async function acceptTaskNode(
  state: AgentStateType,
  config?: RunnableConfig,
): Promise<AgentStatePatch> {
  const reconciled = reconcileExhaustedInProgressTask(state);
  if (reconciled) return reconciled;

  const plan = getProduction(state);
  const taskId = resolveAcceptTaskId(plan);
  if (!taskId) {
    return {};
  }

  const task = plan.pending_tasks.find((t) => t.id === taskId);
  const deliverable = task?.deliverable;
  const profile = getProfile(state);
  const references = getReferences(state);

  if (!task) {
    return {};
  }

  const guidance = defaultTaskGuidance(task.description);
  if (task.direction?.trim()) {
    guidance.direction = task.direction.trim();
  }
  if (task.acceptance_criteria?.trim()) {
    guidance.acceptance_criteria = task.acceptance_criteria.trim();
  }

  let passed = true;
  let feedback = "";
  const acceptanceReviewed = isValidTaskDeliverable(deliverable, task);

  if (!acceptanceReviewed) {
    passed = false;
    feedback = "缺少有效任务交付物，需先完成产出后再验收。";
  } else {
    const llm = createChatModel({ temperature: 0.2 });
    const promptInput = {
      profile,
      references,
      task,
      userRequirements: plan.summary ?? null,
      direction: guidance.direction,
      acceptanceCriteria: guidance.acceptance_criteria,
      deliverableBody: deliverable!.body,
      deliverableNotes: deliverable!.notes,
    };

    const parsed = await invokeStructured(
      llm,
      AcceptResultSchema,
      [
        new SystemMessage(
          buildAcceptTaskSystemPrompt({ profile, references, task }),
        ),
        new HumanMessage(buildAcceptTaskHumanPrompt(promptInput)),
      ],
      { name: "production_accept_task" },
      config,
    );
    passed = parsed.passed;
    feedback = parsed.feedback?.trim() ?? "";
  }

  if (passed) {
    return {
      ...patchPendingProductionFields(state, {
        ...plan,
        pending_tasks: plan.pending_tasks.map((t) =>
          t.id === task.id
            ? {
                ...t,
                status: "ready" as const,
                feedback: null,
                accept_retry_count: 0,
                failure_message: null,
              }
            : t,
        ),
      }),
      ...upsertTurnActivity({
        id: productionTaskActivityId(task.id),
        refId: task.id,
        kind: "production_step",
        status: "done",
        subject: task.description,
      }),
      ...patchAiUsageMetering(state.aiUsage, config),
    };
  }

  const attemptCount = acceptanceReviewed
    ? (task.accept_retry_count ?? 0) + 1
    : (task.accept_retry_count ?? 0);

  if (acceptanceReviewed && attemptCount >= MAX_ACCEPT_ATTEMPTS) {
    return {
      ...patchPendingProductionFields(state, {
        ...plan,
        pending_tasks: plan.pending_tasks.map((t) =>
          t.id === task.id
            ? {
                ...t,
                status: "failed" as const,
                feedback,
                deliverable: null,
                accept_retry_count: attemptCount,
                failure_message: `任务「${task.description}」验收 ${attemptCount} 次仍未通过：${feedback}`,
              }
            : t,
        ),
      }),
      ...patchAiUsageMetering(state.aiUsage, config),
    };
  }

  return {
    ...patchPendingProductionFields(state, {
      ...plan,
      pending_tasks: plan.pending_tasks.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: "in_progress" as const,
              feedback,
              deliverable: null,
              accept_retry_count: attemptCount,
            }
          : t,
      ),
    }),
    ...patchAiUsageMetering(state.aiUsage, config),
  };
}

/** 重试耗尽后：标记当前验收任务失败 */
export function acceptTaskErrorHandler(
  state: AgentStateType,
  error: NodeError,
): AgentStatePatch {
  rethrowUnlessRecoverable(error);
  const plan = getProduction(state);
  const taskId = resolveAcceptTaskId(plan);
  if (!taskId) return {};
  const message = isNodeTimeoutError(error.error)
    ? LLM_TIMEOUT_FAILURE_MESSAGE
    : LLM_FAILURE_MESSAGE;
  return markActiveTaskFailed(state, taskId, message);
}
