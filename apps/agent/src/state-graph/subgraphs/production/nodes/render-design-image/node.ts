/** 设计任务：百炼 qwen-image 文生图（临时 URL + transient；API sync 时物化） */
import type { LangGraphRunnableConfig } from "@langchain/langgraph";

import { generateDesignImage } from "#agent/llm/providers/dashscope-image.js";
import {
  isLlmTimeoutError,
  LLM_TIMEOUT_FAILURE_MESSAGE,
} from "#agent/llm/invoke/timeout.js";
import { resolveImageAspectRatio } from "@yougan/domain";
import {
  getProduction,
  getProfile,
  patchPendingProductionFields,
} from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { markActiveTaskFailed } from "../../helpers/mark-task-failed.js";
import { currentActiveTask } from "../../helpers/task-plan.js";

const MAX_RENDER_ATTEMPTS = 2;

function buildImageGenerationPrompt(input: {
  body: string;
  aspectRatio: string;
  notes?: string | null;
}): string {
  const parts = [input.body.trim()];
  parts.push(
    `Composition: ${input.aspectRatio} aspect ratio, full-bleed, subject and scene fill the entire frame edge to edge.`,
  );
  if (input.notes?.trim()) {
    parts.push(`Context: ${input.notes.trim()}`);
  }
  return parts.join("\n\n");
}

export async function renderDesignImageNode(
  state: AgentStateType,
  config?: LangGraphRunnableConfig,
): Promise<AgentStatePatch> {
  const plan = getProduction(state);
  const task = currentActiveTask(plan);
  if (!task || task.department !== "design") {
    return {};
  }

  const deliverable = task.deliverable;
  const promptBody = deliverable?.body?.trim();
  if (!promptBody) {
    return {};
  }

  if (deliverable?.images?.[0]?.url?.trim()) {
    return {};
  }

  const profile = getProfile(state);
  const aspectRatio = resolveImageAspectRatio(profile);
  let lastError = "图片生成失败";

  for (let attempt = 1; attempt <= MAX_RENDER_ATTEMPTS; attempt += 1) {
    try {
      const generated = await generateDesignImage({
        prompt: buildImageGenerationPrompt({
          body: promptBody,
          aspectRatio,
          notes: deliverable?.notes,
        }),
        aspectRatio,
        responseFormat: "url",
      });

      const imageUrl = generated.imageUrl?.trim();
      if (!imageUrl) {
        throw new Error("DASHSCOPE_IMAGE_URL_EMPTY");
      }

      const images = [
        {
          url: imageUrl,
          alt: deliverable?.title?.trim() || task.description,
          prompt: promptBody,
          transient: true,
        },
      ];

      const pending_tasks = plan.pending_tasks.map((t) =>
        t.id === task.id
          ? {
              ...t,
              deliverable: {
                ...deliverable!,
                images,
                render_error: null,
              },
            }
          : t,
      );

      return {
        ...patchPendingProductionFields(state, { ...plan, pending_tasks }),
      };
    } catch (error) {
      if (isLlmTimeoutError(error)) {
        return {
          ...markActiveTaskFailed(state, task.id, LLM_TIMEOUT_FAILURE_MESSAGE),
        };
      }
      lastError =
        error instanceof Error ? error.message : "图片生成失败，请稍后重试。";
    }
  }

  const pending_tasks = plan.pending_tasks.map((t) =>
    t.id === task.id
      ? {
          ...t,
          deliverable: {
            ...deliverable!,
            images: undefined,
            render_error: lastError,
          },
        }
      : t,
  );

  return {
    ...patchPendingProductionFields(state, { ...plan, pending_tasks }),
  };
}
