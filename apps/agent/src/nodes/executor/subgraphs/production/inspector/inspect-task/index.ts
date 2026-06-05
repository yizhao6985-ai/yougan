import { HumanMessage } from "@langchain/core/messages";
import { z } from "zod";

import { createStructuredModel } from "#agent/llm/dashscope.js";
import { invokeStructuredOutput } from "#agent/lib/structured-output.js";
import { retryTaskDeliverable } from "#agent/lib/production/retry-deliverable.js";
import {
  mergeStagingPatches,
  patchStagingPreview,
  patchStagingProductionMeta,
} from "#agent/lib/staging-state.js";
import {
  parsePreview,
  parseProductionPlan,
} from "#agent/lib/parse-agent-state.js";
import type { AgentStateType } from "#agent/state.js";

const MAX_INSPECT_RETRIES = 2;

const InspectResultSchema = z.object({
  passed: z.boolean().describe("交付物是否通过质检"),
  feedback: z.string().describe("未通过时的具体修改意见；通过时可简短肯定"),
});

export async function inspectProductionNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const meta = state.staging?.meta.production;
  if (!meta?.pendingInspect || !meta.inspectTaskId) {
    return {};
  }

  const plan = parseProductionPlan(state);
  const task = plan.pending_tasks.find((t) => t.id === meta.inspectTaskId)
    ?? plan.executed_tasks.find((t) => t.id === meta.inspectTaskId);
  const preview = parsePreview(state);

  if (!task || !preview?.body?.trim()) {
    return patchStagingProductionMeta(state, {
      pendingInspect: false,
      inspectTaskId: null,
      inspectPipeline: null,
    });
  }

  const llm = createStructuredModel({ temperature: 0.2 });
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
    const parsed = await invokeStructuredOutput(
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
    return patchStagingProductionMeta(state, {
      pendingInspect: false,
      inspectTaskId: null,
      inspectPipeline: null,
      lastInspectFeedback: null,
      inspectRetryCount: 0,
    });
  }

  const retryCount = (meta.inspectRetryCount ?? 0) + 1;
  if (retryCount > MAX_INSPECT_RETRIES) {
    return patchStagingProductionMeta(state, {
      pendingInspect: false,
      inspectTaskId: null,
      inspectPipeline: null,
      lastInspectFeedback: feedback,
      inspectRetryCount: retryCount,
    });
  }

  const retried = await retryTaskDeliverable(state, task, feedback);
  return mergeStagingPatches(
    retried ? patchStagingPreview(state, retried) : {},
    patchStagingProductionMeta(state, {
      pendingInspect: true,
      inspectRetryCount: retryCount,
      lastInspectFeedback: feedback,
    }),
  );
}
