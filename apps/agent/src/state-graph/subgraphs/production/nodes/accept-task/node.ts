/** 单任务方向性验收；仅更新任务状态，流转由 routeProduction 负责 */
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";
import { z } from "zod";

import { invokeStructured } from "#agent/llm/invoke/index.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import {
  emitRunProgress,
  patchRunProgress,
  withRunProgressHeartbeat,
} from "#agent/state-io/run-progress.js";
import {
  getProduction,
  getProfile,
  getReferences,
  patchPendingProductionFields,
} from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { acceptAttemptsExhausted, MAX_ACCEPT_ATTEMPTS } from "../../helpers/pipeline.js";
import { productionAcceptProgress } from "../../helpers/progress-labels.js";
import {
  currentActiveTask,
  defaultTaskGuidance,
  taskAwaitingAccept,
} from "../../helpers/task-plan.js";
import { isValidTaskDeliverable } from "./helpers/deliverable.js";
import {
  buildAcceptTaskHumanPrompt,
  buildAcceptTaskSystemPrompt,
} from "./prompt.js";

/** 待验收任务：有 deliverable 或当前 in_progress（执行后无论是否产出都应验收） */
function resolveAcceptTarget(state: AgentStateType): {
  taskId: string;
} | null {
  const plan = getProduction(state);
  const withDeliverable = plan.pending_tasks.find(taskAwaitingAccept);
  if (withDeliverable) return { taskId: withDeliverable.id };

  const active = currentActiveTask(plan);
  if (active) return { taskId: active.id };

  return null;
}

const AcceptResultSchema = z.object({
  passed: z.boolean().describe("是否通过方向性验收"),
  feedback: z.string().describe("未通过时的具体修改建议；通过时可简短肯定"),
});

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

  return patchPendingProductionFields(state, {
    ...plan,
    pending_tasks: plan.pending_tasks.map((t) =>
      t.id === stuck.id
        ? {
            ...t,
            status: "failed" as const,
            deliverable: null,
            failure_message:
              t.failure_message?.trim() ||
              `任务「${t.description}」验收已达上限仍未通过，已终止。`,
          }
        : t,
    ),
  });
}

export async function acceptTaskNode(
  state: AgentStateType,
  config?: RunnableConfig,
): Promise<AgentStatePatch> {
  const reconciled = reconcileExhaustedInProgressTask(state);
  if (reconciled) return reconciled;

  const target = resolveAcceptTarget(state);
  if (!target) {
    return {};
  }

  const plan = getProduction(state);
  const task = plan.pending_tasks.find((t) => t.id === target.taskId);
  const deliverable = task?.deliverable;
  const profile = getProfile(state);
  const references = getReferences(state);

  if (!task) {
    return {};
  }

  const progress = productionAcceptProgress(task.description);
  const progressPatch = patchRunProgress(progress);
  emitRunProgress(progress, config);

  const guidance = defaultTaskGuidance(task.description);
  if (task.direction?.trim()) {
    guidance.direction = task.direction.trim();
  }
  if (task.acceptance_criteria?.trim()) {
    guidance.acceptance_criteria = task.acceptance_criteria.trim();
  }

  let passed = true;
  let feedback = "";

  if (!isValidTaskDeliverable(deliverable)) {
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

    try {
      const parsed = await withRunProgressHeartbeat(progress, config, () =>
        invokeStructured(
          llm,
          AcceptResultSchema,
          [
            new SystemMessage(buildAcceptTaskSystemPrompt({ profile, references })),
            new HumanMessage(buildAcceptTaskHumanPrompt(promptInput)),
          ],
          { name: "production_accept_task" },
          config,
        ),
      );
      passed = parsed.passed;
      feedback = parsed.feedback?.trim() ?? "";
    } catch {
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
      ...progressPatch,
    };
  }

  const attemptCount = (task.accept_retry_count ?? 0) + 1;

  if (attemptCount >= MAX_ACCEPT_ATTEMPTS) {
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
      ...progressPatch,
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
    ...progressPatch,
  };
}
