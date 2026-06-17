/**
 * MiniMax image-01 文生图 API。
 * @see https://platform.minimaxi.com/docs/api-reference/image-generation-t2i
 */
import { env } from "#agent/env.js";

const MINIMAX_ASPECT_RATIOS = new Set([
  "1:1",
  "16:9",
  "4:3",
  "3:2",
  "2:3",
  "3:4",
  "9:16",
  "21:9",
]);

export type GenerateMiniMaxImageInput = {
  prompt: string;
  aspectRatio?: string | null;
  responseFormat?: "url" | "base64";
};

export type GenerateMiniMaxImageResult = {
  imageBase64?: string;
  imageUrl?: string;
  requestId?: string;
};

type MiniMaxImageGenerationResponse = {
  id?: string;
  data?: {
    image_urls?: string[];
    image_base64?: string[];
  };
  base_resp?: {
    status_code?: number;
    status_msg?: string;
  };
};

function resolveImageGenerationUrl(): string {
  const base = env.minimaxBaseUrl.replace(/\/$/, "");
  if (base.endsWith("/v1")) {
    return `${base}/image_generation`;
  }
  return `${base}/v1/image_generation`;
}

function normalizeAspectRatio(value: string | null | undefined): string {
  const trimmed = value?.trim();
  if (trimmed && MINIMAX_ASPECT_RATIOS.has(trimmed)) {
    return trimmed;
  }
  return "1:1";
}

export async function generateMiniMaxImage(
  input: GenerateMiniMaxImageInput,
): Promise<GenerateMiniMaxImageResult> {
  if (!env.minimaxApiKey) {
    throw new Error("MINIMAX_API_KEY_MISSING");
  }

  const responseFormat = input.responseFormat ?? "url";
  const response = await fetch(resolveImageGenerationUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.minimaxApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.minimaxImageModel,
      prompt: input.prompt.slice(0, 1500),
      aspect_ratio: normalizeAspectRatio(input.aspectRatio),
      response_format: responseFormat,
      n: 1,
      prompt_optimizer: false,
      aigc_watermark: false,
    }),
  });

  const payload = (await response.json()) as MiniMaxImageGenerationResponse;
  const statusCode = payload.base_resp?.status_code;
  if (!response.ok || (statusCode != null && statusCode !== 0)) {
    throw new Error(
      payload.base_resp?.status_msg ??
        `MINIMAX_IMAGE_REQUEST_FAILED: ${response.status}`,
    );
  }

  const imageBase64 = payload.data?.image_base64?.[0];
  const imageUrl = payload.data?.image_urls?.[0];
  if (!imageBase64 && !imageUrl) {
    throw new Error(
      payload.base_resp?.status_msg ?? "MINIMAX_IMAGE_GENERATION_FAILED",
    );
  }

  return {
    imageBase64,
    imageUrl,
    requestId: payload.id,
  };
}
