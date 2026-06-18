import type {
  PublicationSummary,
  PreviewBlock,
  WorkProfile,
} from "@yougan/domain";
import {
  buildCompositionLabel,
  buildPublicationSummary,
} from "@yougan/domain";

import { env } from "../env.js";

type AiSummaryPatch = Partial<
  Pick<PublicationSummary, "title" | "hook" | "compositionLabel">
>;

function blocksDigest(blocks: PreviewBlock[]): string {
  return blocks
    .map((block, index) => {
      switch (block.type) {
        case "text":
          return `[${index + 1}] 文字：${block.markdown.trim().slice(0, 400)}`;
        case "image":
          return `[${index + 1}] 图片：${block.alt?.trim() || block.prompt?.trim() || "（无说明）"}`;
        case "audio":
          return `[${index + 1}] 音频：${block.title?.trim() || "（无标题）"}`;
        case "video":
          return `[${index + 1}] 视频：${block.title?.trim() || "（无标题）"}`;
        default:
          return `[${index + 1}] 未知块`;
      }
    })
    .join("\n");
}

async function callDashScopeSummary(input: {
  blocks: PreviewBlock[];
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
- compositionLabel 用自然语言描述 block 构成，如「防晒测评 · 3 图 · 附短视频」，不超过 24 字
- 只返回 JSON：{"title":"...","hook":"...","compositionLabel":"..."}`;

  const user = `创作定位：${intent}
当前构成（机械统计）：${mechanicalLabel}
当前标题：${input.baseline.title}
当前摘要：${input.baseline.hook}

作品内容片段（按顺序）：
${blocksDigest(input.blocks)}

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
  blocks: PreviewBlock[];
  preview?: {
    title?: string | null;
    hook?: string | null;
    hashtags?: string[];
  } | null;
  workTitle?: string | null;
  profile?: WorkProfile | unknown | null;
}): Promise<PublicationSummary> {
  const baseline = buildPublicationSummary({
    blocks: input.blocks,
    preview: input.preview
      ? { ...input.preview, blocks: input.blocks }
      : null,
    workTitle: input.workTitle,
    profile: input.profile,
  });

  try {
    const profile =
      input.profile && typeof input.profile === "object"
        ? (input.profile as WorkProfile)
        : null;
    const patch = await callDashScopeSummary({
      blocks: input.blocks,
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
