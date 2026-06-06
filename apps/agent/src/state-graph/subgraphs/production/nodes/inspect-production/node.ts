/** 单任务交付物质检；不通过时标记 staging.meta 供 retry-deliverable-or-end 重试 */
import { HumanMessage } from "@langchain/core/messages";
import { z } from "zod";

import { invokeStructured } from "#agent/llm/invoke/index.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import { retryTaskDeliverable } from "./helpers/retry-deliverable.js";
import {
  patchPendingBatch,
  patchPendingPreview,
  patchPendingProductionMeta,
} from "#agent/state-io/index.js";
import {
  getPreview,
  getProductionPlan,
  getProductionStagingMeta,
} from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

const MAX_INSPECT_RETRIES = 2;

const InspectResultSchema = z.object({
  passed: z.boolean().describe("交付物是否通过质检"),
  feedback: z.string().describe("未通过时的具体修改意见；通过时可简短肯定"),
});

export async function inspectProductionNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const meta = getProductionStagingMeta(state);
  if (!meta.pendingInspect || !meta.inspectTaskId) {
    return {};
  }

  const plan = getProductionPlan(state);
  const task = plan.pending_tasks.find((t) => t.id === meta.inspectTaskId)
    ?? plan.executed_tasks.find((t) => t.id === meta.inspectTaskId);
  const preview = getPreview(state);

  if (!task || !preview?.body?.trim()) {
    return patchPendingProductionMeta(state, {
      pendingInspect: false,
      inspectTaskId: null,
      inspectPipeline: null,
    });
  }

  const llm = createChatModel({ temperature: 0.2 });
  const prompt = `你是制作质检员，检查以下任务交付物是否满足任务要求。

任务：${task.description}
部门：${task.department ?? "writing"}

交付物正文（节选）：
${preview.body.slice(0, 1500)}
${preview.notes ? `\n备注：${preview.notes.slice(0, 800)}` : ""}

标准：内容完整、符合任务描述、无明显跑题或空洞套话。`;

  let passed = true;
  let feedback = "";

  try {
    const parsed = await invokeStructured(
      llm,
      InspectResultSchema,
      [new HumanMessage(prompt)],
      { name: "production_inspect" },
    );
    passed = parsed.passed;
    feedback = parsed.feedback?.trim() ?? "";
  } catch {
    passed = true;
  }

  if (passed) {
    return patchPendingProductionMeta(state, {
      pendingInspect: false,
      inspectTaskId: null,
      inspectPipeline: null,
      lastInspectFeedback: null,
      inspectRetryCount: 0,
    });
  }

  const retryCount = (meta.inspectRetryCount ?? 0) + 1;
  if (retryCount > MAX_INSPECT_RETRIES) {
    return patchPendingProductionMeta(state, {
      pendingInspect: false,
      inspectTaskId: null,
      inspectPipeline: null,
      lastInspectFeedback: feedback,
      inspectRetryCount: retryCount,
    });
  }

  const retried = await retryTaskDeliverable(state, task, feedback);
  return patchPendingBatch(
    retried ? patchPendingPreview(state, retried) : {},
    patchPendingProductionMeta(state, {
      pendingInspect: true,
      inspectRetryCount: retryCount,
      lastInspectFeedback: feedback,
    }),
  );
}
