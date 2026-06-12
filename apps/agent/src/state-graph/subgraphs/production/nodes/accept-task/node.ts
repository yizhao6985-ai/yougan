/** 单任务方向性验收；仅更新任务状态，流转由 routeProduction 负责 */
import { HumanMessage } from "@langchain/core/messages";
import { z } from "zod";

import { invokeStructured } from "#agent/llm/invoke/index.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import { profileSummary } from "#agent/prompts/profile-summary.js";
import {
  getProduction,
  getProfile,
  getReferences,
  patchPendingProductionFields,
} from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { isValidTaskDeliverable } from "../../helpers/deliverable.js";
import { MAX_ACCEPT_ATTEMPTS } from "../../helpers/pipeline.js";
import {
  defaultTaskGuidance,
  taskAwaitingAccept,
} from "../../helpers/task-plan.js";
import { buildWordCountRequirement } from "../../helpers/word-count-guidance.js";

function resolveAcceptTarget(state: AgentStateType): {
  taskId: string;
} | null {
  const plan = getProduction(state);
  const task = plan.pending_tasks.find(taskAwaitingAccept);
  if (!task) return null;
  return { taskId: task.id };
}

const AcceptResultSchema = z.object({
  passed: z.boolean().describe("是否通过方向性验收"),
  feedback: z.string().describe("未通过时的具体修改建议；通过时可简短肯定"),
});

export async function acceptTaskNode(
  state: AgentStateType,
): Promise<AgentStatePatch> {
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

  const guidance = defaultTaskGuidance(task.description);
  if (task.direction?.trim()) {
    guidance.direction = task.direction.trim();
  }
  if (task.acceptance_criteria?.trim()) {
    guidance.acceptance_criteria = task.acceptance_criteria.trim();
  }

  let passed = true;
  let feedback = "";

  const wordCountRequirement = buildWordCountRequirement(profile);
  const wordCountNote = wordCountRequirement
    ? `方案全文篇幅要求（${wordCountRequirement}）在 assemblePreview 整合阶段统一校验；本任务仅验收片段是否方向正确、质量达标，勿按全文字数否决单片段。`
    : "";

  if (!isValidTaskDeliverable(deliverable)) {
    passed = false;
    feedback = "缺少有效任务交付物，需先完成产出后再验收。";
  } else {
    const llm = createChatModel({ temperature: 0.2 });
    const prompt = `你是制作验收员，从**总监方向指导**层面验收单任务产出（不是只看有没有写完）。

## 任务
描述：${task.description}
部门：${task.department ?? "writing"}

## 总监方向指导
${guidance.direction}

## 方向性验收标准
${guidance.acceptance_criteria}

## 作品方案（profile 摘要）
${profileSummary(profile, references)}

计划摘要：${plan.summary ?? "无"}

## 本任务交付物
${deliverable!.body.slice(0, 2000)}
${deliverable!.notes ? `\n备注：${deliverable!.notes.slice(0, 500)}` : ""}

验收重点：是否契合作品方案的方向、体裁与规则；是否响应该任务的目标与总监指导；实现质量是否达标。
${wordCountNote}`;

    try {
      const parsed = await invokeStructured(
        llm,
        AcceptResultSchema,
        [new HumanMessage(prompt)],
        { name: "production_accept_task" },
      );
      passed = parsed.passed;
      feedback = parsed.feedback?.trim() ?? "";
    } catch {
      passed = false;
      feedback = "验收服务暂时不可用，请重新执行该任务。";
    }
  }

  if (passed) {
    return patchPendingProductionFields(state, {
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
    });
  }

  const attemptCount = (task.accept_retry_count ?? 0) + 1;

  if (attemptCount >= MAX_ACCEPT_ATTEMPTS) {
    return patchPendingProductionFields(state, {
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
    });
  }

  return patchPendingProductionFields(state, {
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
  });
}
