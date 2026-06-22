/** 音频任务：多模态解析用户上传的音频素材，写入 deliverable */
import type { LangGraphRunnableConfig } from "@langchain/langgraph";
import type { ReferenceAnalysis } from "@yougan/domain";

import { patchAiUsageMetering } from "#agent/llm/invoke/metering.js";
import {
  getProduction,
  getReferences,
  patchPendingProductionFields,
} from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { analyzeReferenceContent } from "../../../reference/nodes/run-preprocess-tools/tools/helpers/analyze/analyze-content.js";
import { prepareReferenceAsset } from "../../../reference/nodes/run-preprocess-tools/tools/helpers/prepare/prepare-asset.js";
import { resolveProductionAudioAsset } from "../../helpers/resolve-production-audio-asset.js";
import {
  audioTaskNeedsIngest,
  currentActiveTask,
  isAudioTask,
  taskNeedsProduce,
} from "../../helpers/task-plan.js";

function existingAudioAnalysis(
  state: AgentStateType,
  assetUrl: string,
): ReferenceAnalysis | null {
  const normalized = assetUrl.trim();
  if (!normalized) return null;

  for (let i = getReferences(state).length - 1; i >= 0; i -= 1) {
    const ref = getReferences(state)[i];
    if (ref.asset.url.trim() !== normalized) continue;
    const summary = ref.analysis.summary?.trim();
    if (!summary) continue;
    return ref.analysis;
  }

  return null;
}

export async function ingestProductionAudioNode(
  state: AgentStateType,
  config?: LangGraphRunnableConfig,
): Promise<AgentStatePatch> {
  const plan = getProduction(state);
  const task = currentActiveTask(plan);
  if (
    !task ||
    !isAudioTask(task) ||
    !audioTaskNeedsIngest(state, task) ||
    !taskNeedsProduce(task)
  ) {
    return {};
  }

  const asset = resolveProductionAudioAsset(state);
  if (!asset) {
    return {};
  }

  const body = asset.url.trim();
  let title: string | null = asset.original_name?.trim() || null;
  let notes: string | null = null;

  const cached = existingAudioAnalysis(state, body);
  if (cached) {
    notes =
      cached.transcript?.trim() ||
      cached.summary?.trim() ||
      "音频已入库，未能生成完整转写稿。";
    if (!title && cached.summary?.trim()) {
      title = cached.summary.trim().slice(0, 80);
    }
  } else {
    try {
      const prep = await prepareReferenceAsset(asset);
      const analysis = await analyzeReferenceContent(prep);

      notes =
        analysis.transcript?.trim() ||
        analysis.summary?.trim() ||
        "音频已入库，未能生成完整转写稿。";
      if (!title && analysis.summary?.trim()) {
        title = analysis.summary.trim().slice(0, 80);
      }
    } catch {
      notes = "音频素材已上传，自动解析暂未完成，请稍后重试。";
    }
  }

  const pending_tasks = plan.pending_tasks.map((t) =>
    t.id === task.id
      ? {
          ...t,
          status: "in_progress" as const,
          feedback: null,
          deliverable: {
            body,
            title,
            notes,
          },
        }
      : t,
  );

  return {
    ...patchPendingProductionFields(state, { ...plan, pending_tasks }),
    ...patchAiUsageMetering(state.aiUsage, config),
  };
}
