/** 单任务方向性验收；仅更新任务状态，流转由 routeProduction 负责 */
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";
import { z } from "zod";

import { invokeStructured } from "#agent/llm/invoke/index.js";
import {
  isLlmTimeoutError,
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

import { acceptAttemptsExhausted, MAX_ACCEPT_ATTEMPTS } from "../../helpers/pipeline.js";
import { markActiveTaskFailed } from "../../helpers/mark-task-failed.js";
import {
  defaultTaskGuidance,
  isDesignTask,
  resolveAcceptTaskId,
  taskAwaitingAccept,
  taskNeedsRenderRetryAccept,
} from "../../helpers/task-plan.js";
import {
  isValidDesignPromptDeliverable,
  isValidTaskDeliverable,
} from "./helpers/deliverable.js";
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
      !taskAwaitingAccept(t) &&
      !taskNeedsRenderRetryAccept(t),
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
  // 结构层：交付物字段非空即可进入 LLM 验收；内容质量由验收员判断
  const acceptanceReviewed = isValidTaskDeliverable(deliverable, task);

  if (!acceptanceReviewed) {
    passed = false;
    if (
      isDesignTask(task) &&
      isValidDesignPromptDeliverable(deliverable) &&
      !deliverable?.images?.[0]?.url?.trim()
    ) {
      feedback =
        deliverable?.render_error?.trim() ||
        "图片尚未生成或生成失败，将重试出图。";
    } else {
      feedback = "缺少有效任务交付物，需先完成产出后再验收。";
    }
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
      deliverableNotes:
        task.department === "design"
          ? [
              deliverable!.title?.trim()
                ? `标题：${deliverable!.title.trim()}`
                : null,
              deliverable!.notes?.trim()
                ? `短说明：${deliverable!.notes.trim()}`
                : null,
              deliverable!.images?.[0]?.url?.trim()
                ? `成图 URL（仅证明已出图，勿据此评判画面）：${deliverable!.images[0].url.trim()}`
                : null,
            ]
              .filter(Boolean)
              .join("\n") || null
          : deliverable!.notes,
    };

    try {
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
    } catch (error) {
      if (isLlmTimeoutError(error)) {
        return {
          ...markActiveTaskFailed(state, task.id, LLM_TIMEOUT_FAILURE_MESSAGE),
          ...patchAiUsageMetering(state.aiUsage, config),
        };
      }
      passed = false;
      feedback = "验收服务暂时不可用，请重新执行该任务。";
    }
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

  const renderRetryOnly = taskNeedsRenderRetryAccept(task);

  if (renderRetryOnly) {
    return {
      ...patchPendingProductionFields(state, {
        ...plan,
        pending_tasks: plan.pending_tasks.map((t) =>
          t.id === task.id
            ? {
                ...t,
                status: "in_progress" as const,
                feedback,
                deliverable: {
                  ...deliverable!,
                  images: undefined,
                  render_error: feedback,
                },
              }
            : t,
        ),
      }),
      ...patchAiUsageMetering(state.aiUsage, config),
    };
  }

  // 仅 LLM 方向性验收未通过时计数
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
