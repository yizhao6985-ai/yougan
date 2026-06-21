/**
 * 百炼 Qwen-Image 文生图（DashScope 原生 multimodal-generation API）。
 * @see https://help.aliyun.com/zh/model-studio/qwen-image-api
 */
import {
  aspectRatioToQwenImageSize,
  normalizeDesignImageAspectRatio,
} from "@yougan/domain";

import { env } from "#agent/env.js";
import { LLM_TIMEOUT_MS, withLlmRetry } from "#agent/llm/invoke/timeout.js";
import { DASHSCOPE_MODELS } from "./catalog.js";

const IMAGE_GENERATION_PATH =
  "/services/aigc/multimodal-generation/generation";

export type GenerateDesignImageInput = {
  prompt: string;
  aspectRatio?: string | null;
  negativePrompt?: string | null;
  responseFormat?: "url";
};

export type GenerateDesignImageResult = {
  imageUrl?: string;
  requestId?: string;
};

type QwenImageGenerationResponse = {
  request_id?: string;
  code?: string;
  message?: string;
  output?: {
    choices?: Array<{
      message?: {
        content?: Array<{ image?: string; text?: string }>;
      };
    }>;
    results?: Array<{ url?: string }>;
  };
};

function resolveImageGenerationUrl(): string {
  const base = env.dashscopeApiBaseUrl.replace(/\/$/, "");
  return `${base}${IMAGE_GENERATION_PATH}`;
}

function extractImageUrl(payload: QwenImageGenerationResponse): string | undefined {
  const fromResults = payload.output?.results?.find((r) => r.url?.trim())?.url;
  if (fromResults?.trim()) return fromResults.trim();

  for (const choice of payload.output?.choices ?? []) {
    for (const part of choice.message?.content ?? []) {
      if (part.image?.trim()) return part.image.trim();
    }
  }

  return undefined;
}

export async function generateDesignImage(
  input: GenerateDesignImageInput,
): Promise<GenerateDesignImageResult> {
  if (!env.dashscopeApiKey) {
    throw new Error("DASHSCOPE_API_KEY_MISSING");
  }

  const aspectRatio = normalizeDesignImageAspectRatio(input.aspectRatio);
  const size = aspectRatioToQwenImageSize(aspectRatio);

  return withLlmRetry({
    timeoutMs: LLM_TIMEOUT_MS.image,
    run: async (signal) => {
      const response = await fetch(resolveImageGenerationUrl(), {
        method: "POST",
        signal,
        headers: {
          Authorization: `Bearer ${env.dashscopeApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: DASHSCOPE_MODELS.image,
          input: {
            messages: [
              {
                role: "user",
                content: [{ text: input.prompt.slice(0, 1500) }],
              },
            ],
          },
          parameters: {
            size,
            n: 1,
            prompt_extend: false,
            watermark: false,
            ...(input.negativePrompt?.trim()
              ? { negative_prompt: input.negativePrompt.trim() }
              : {}),
          },
        }),
      });

      const payload = (await response.json()) as QwenImageGenerationResponse;
      if (!response.ok || (payload.code && payload.code !== "Success")) {
        throw new Error(
          payload.message ??
            `DASHSCOPE_IMAGE_REQUEST_FAILED: ${response.status}`,
        );
      }

      const imageUrl = extractImageUrl(payload);
      if (!imageUrl) {
        throw new Error(payload.message ?? "DASHSCOPE_IMAGE_GENERATION_FAILED");
      }

      return {
        imageUrl,
        requestId: payload.request_id,
      };
    },
  });
}
