/**
 * 阿里百炼 Qwen-Image 文生图 API。
 * @see https://help.aliyun.com/zh/model-studio/qwen-image-api
 */
import { env } from "../env.js";

const IMAGE_GENERATION_PATH =
  "/services/aigc/multimodal-generation/generation";

export type GenerateImageInput = {
  prompt: string;
  size?: string;
  negativePrompt?: string;
  promptExtend?: boolean;
  watermark?: boolean;
};

export type GenerateImageResult = {
  imageUrl: string;
  requestId?: string;
  width?: number;
  height?: number;
};

type ImageGenerationResponse = {
  request_id?: string;
  code?: string;
  message?: string;
  output?: {
    choices?: Array<{
      message?: {
        content?: Array<{ image?: string }>;
      };
    }>;
  };
  usage?: {
    width?: number;
    height?: number;
  };
};

export async function generateImage(
  input: GenerateImageInput,
): Promise<GenerateImageResult> {
  if (!env.dashscopeApiKey) {
    throw new Error("DASHSCOPE_API_KEY_MISSING");
  }

  const response = await fetch(
    `${env.dashscopeApiBaseUrl}${IMAGE_GENERATION_PATH}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.dashscopeApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.llmModelImage,
        input: {
          messages: [
            {
              role: "user",
              content: [{ text: input.prompt }],
            },
          ],
        },
        parameters: {
          size: input.size ?? "2048*2048",
          prompt_extend: input.promptExtend ?? true,
          watermark: input.watermark ?? false,
          ...(input.negativePrompt
            ? { negative_prompt: input.negativePrompt }
            : {}),
        },
      }),
    },
  );

  const payload = (await response.json()) as ImageGenerationResponse;

  if (!response.ok) {
    throw new Error(
      payload.message ??
        `DASHSCOPE_IMAGE_REQUEST_FAILED: ${response.status}`,
    );
  }

  const imageUrl =
    payload.output?.choices?.[0]?.message?.content?.[0]?.image;
  if (!imageUrl) {
    throw new Error(
      payload.message ?? "DASHSCOPE_IMAGE_GENERATION_FAILED",
    );
  }

  return {
    imageUrl,
    requestId: payload.request_id,
    width: payload.usage?.width,
    height: payload.usage?.height,
  };
}
