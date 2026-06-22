import type {
  PublicationSummary,
  WorkPreview,
  WorkProfile,
} from "@yougan/domain";
import {
  buildCompositionLabel,
  buildPublicationSummary,
  previewImages,
  previewPlainText,
} from "@yougan/domain";

import { env } from "../env.js";

type AiSummaryPatch = Partial<
  Pick<PublicationSummary, "title" | "hook" | "compositionLabel">
>;

function previewDigest(preview: WorkPreview): string {
  const parts: string[] = [];
  const body = previewPlainText(preview);
  if (body) {
    parts.push(`[正文] ${body.slice(0, 400)}`);
  }
  previewImages(preview).forEach((image, index) => {
    parts.push(
      `[图 ${index + 1}] ${image.alt?.trim() || image.prompt?.trim() || "（无说明）"}`,
    );
  });
  return parts.join("\n") || "（无内容）";
}

async function callDashScopeSummary(input: {
  preview: WorkPreview;
  profile: WorkProfile | null;
  baseline: PublicationSummary;
}): Promise<AiSummaryPatch | null> {
  const apiKey = env.llm.dashscopeApiKey;
  if (!apiKey) return null;

  const intent = input.profile?.direction.summary?.trim() || "未指定";
  const mechanicalLabel = buildCompositionLabel(
    input.baseline.blockComposition,
  );

  const system = `你是发布编辑，为混排作品内容生成推荐流摘要。
要求：
- 不要改写正文，只输出列表展示用的 title、hook、compositionLabel
- title 概括整件作品，15–30 字
- hook 是一句话摘要，40–80 字，吸引点击
- compositionLabel 用自然语言描述内容构成，如「防晒测评 · 3 图」，不超过 24 字
- 只返回 JSON：{"title":"...","hook":"...","compositionLabel":"..."}`;

  const user = `创作定位：${intent}
当前构成（机械统计）：${mechanicalLabel}
当前标题：${input.baseline.title}
当前摘要：${input.baseline.hook}

作品内容片段：
${previewDigest(input.preview)}

请输出 JSON。`;

  const response = await fetch(`${env.llm.dashscopeBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.llm.dashscopeChatModel,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    console.warn(
      "[summarize-publication-summary] DashScope request failed:",
      response.status,
    );
    return null;
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) return null;

  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    const patch: AiSummaryPatch = {};
    if (typeof parsed.title === "string" && parsed.title.trim()) {
      patch.title = parsed.title.trim();
    }
    if (typeof parsed.hook === "string" && parsed.hook.trim()) {
      patch.hook = parsed.hook.trim();
    }
    if (
      typeof parsed.compositionLabel === "string" &&
      parsed.compositionLabel.trim()
    ) {
      patch.compositionLabel = parsed.compositionLabel.trim();
    }
    return Object.keys(patch).length ? patch : null;
  } catch {
    return null;
  }
}

export async function summarizePublicationSummary(input: {
  preview: WorkPreview;
  workTitle?: string | null;
  profile?: WorkProfile | unknown | null;
}): Promise<PublicationSummary> {
  const baseline = buildPublicationSummary({
    preview: input.preview,
    workTitle: input.workTitle,
    profile: input.profile,
  });

  try {
    const profile =
      input.profile && typeof input.profile === "object"
        ? (input.profile as WorkProfile)
        : null;
    const patch = await callDashScopeSummary({
      preview: input.preview,
      profile,
      baseline,
    });
    if (patch) {
      return { ...baseline, ...patch };
    }
  } catch (error) {
    console.warn("[summarize-publication-summary] AI enhancement failed:", error);
  }

  return baseline;
}
