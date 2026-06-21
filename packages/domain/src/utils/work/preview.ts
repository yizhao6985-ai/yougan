import { nanoid } from "nanoid";

import type { ContentFormatId } from "../../models/content-form/formats.js";
import type { ProductionDraftImage } from "../../models/work/production-draft.js";
import type {
  IllustrationPreviewContent,
  NotePreviewContent,
  PreviewBlock,
  PreviewContent,
  PreviewImage,
  ScriptPreviewContent,
  TextPreviewContent,
  WorkPreview,
} from "../../models/work/preview.js";
import { defaultPreviewContentKind } from "../../models/work/preview.js";
import type { ProductionTask } from "../../models/work/production.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function parsePreviewImage(raw: unknown): PreviewImage | null {
  if (!isRecord(raw)) return null;
  const url = typeof raw.url === "string" ? raw.url.trim() : "";
  if (!url) return null;
  return {
    id: typeof raw.id === "string" && raw.id.trim() ? raw.id : nanoid(),
    url,
    alt: typeof raw.alt === "string" ? raw.alt : null,
    prompt: typeof raw.prompt === "string" ? raw.prompt : null,
    transient: raw.transient === true ? true : undefined,
    taskId: typeof raw.taskId === "string" ? raw.taskId : null,
  };
}

function parsePreviewImages(raw: unknown): PreviewImage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => parsePreviewImage(item))
    .filter((item): item is PreviewImage => item !== null);
}

function parseTextPreviewContent(
  kind: TextPreviewContent["kind"],
  raw: Record<string, unknown>,
): TextPreviewContent | null {
  const body = typeof raw.body === "string" ? raw.body.trim() : "";
  if (!body) return null;
  return {
    kind,
    body,
    cover: parsePreviewImage(raw.cover),
    images: parsePreviewImages(raw.images),
  };
}

export function parsePreviewContent(raw: unknown): PreviewContent | null {
  if (!isRecord(raw)) return null;
  const kind = typeof raw.kind === "string" ? raw.kind : "";
  const body = typeof raw.body === "string" ? raw.body.trim() : "";

  switch (kind) {
    case "note": {
      if (!body) return null;
      return {
        kind: "note",
        body,
        images: parsePreviewImages(raw.images),
      };
    }
    case "article":
    case "blog":
    case "short_post":
    case "novel":
      return parseTextPreviewContent(kind, raw);
    case "video_script":
    case "short_video":
    case "podcast":
    case "music": {
      if (!body) return null;
      return { kind, body };
    }
    case "illustration": {
      const images = parsePreviewImages(raw.images);
      if (!images.length) return null;
      return {
        kind: "illustration",
        images,
        caption: typeof raw.caption === "string" ? raw.caption : null,
      };
    }
    default:
      return null;
  }
}

/** @deprecated 读库迁移 */
export function parsePreviewBlock(raw: unknown): PreviewBlock | null {
  if (!isRecord(raw)) return null;
  const type = typeof raw.type === "string" ? raw.type : "";
  const id = typeof raw.id === "string" && raw.id.trim() ? raw.id : nanoid();
  const taskId = typeof raw.taskId === "string" ? raw.taskId : null;

  switch (type) {
    case "text": {
      const markdown = typeof raw.markdown === "string" ? raw.markdown.trim() : "";
      if (!markdown) return null;
      return { id, type: "text", markdown, taskId };
    }
    case "image": {
      const url = typeof raw.url === "string" ? raw.url.trim() : "";
      if (!url) return null;
      return {
        id,
        type: "image",
        url,
        alt: typeof raw.alt === "string" ? raw.alt : null,
        prompt: typeof raw.prompt === "string" ? raw.prompt : null,
        transient: raw.transient === true ? true : undefined,
        taskId,
      };
    }
    case "audio": {
      const url = typeof raw.url === "string" ? raw.url.trim() : "";
      if (!url) return null;
      return {
        id,
        type: "audio",
        url,
        title: typeof raw.title === "string" ? raw.title : null,
        durationSec: typeof raw.durationSec === "number" ? raw.durationSec : null,
        transcript: typeof raw.transcript === "string" ? raw.transcript : null,
        taskId,
      };
    }
    case "video": {
      const url = typeof raw.url === "string" ? raw.url.trim() : "";
      if (!url) return null;
      return {
        id,
        type: "video",
        url,
        posterUrl: typeof raw.posterUrl === "string" ? raw.posterUrl : null,
        title: typeof raw.title === "string" ? raw.title : null,
        durationSec: typeof raw.durationSec === "number" ? raw.durationSec : null,
        taskId,
      };
    }
    default:
      return null;
  }
}

/** @deprecated */
export function parsePreviewBlocks(raw: unknown): PreviewBlock[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => parsePreviewBlock(item))
    .filter((item): item is PreviewBlock => item !== null);
}

function blocksToTextParts(blocks: PreviewBlock[]): string[] {
  return blocks.flatMap((block) => {
    if (block.type === "text") return [block.markdown.trim()];
    if (block.type === "audio" && block.transcript?.trim()) {
      return [block.transcript.trim()];
    }
    return [];
  });
}

function blocksToImages(blocks: PreviewBlock[]): PreviewImage[] {
  return blocks.flatMap((block) => {
    if (block.type !== "image" || !block.url.trim()) return [];
    return [
      {
        id: block.id,
        url: block.url,
        alt: block.alt ?? null,
        prompt: block.prompt ?? null,
        transient: block.transient,
        taskId: block.taskId ?? null,
      },
    ];
  });
}

export function migrateBlocksToContent(
  blocks: PreviewBlock[],
  format: ContentFormatId | null | undefined,
): PreviewContent | null {
  if (!blocks.length) return null;

  const kind = defaultPreviewContentKind(format);
  const body = blocksToTextParts(blocks).filter(Boolean).join("\n\n");
  const images = blocksToImages(blocks);

  if (kind === "illustration") {
    if (!images.length) return null;
    return { kind: "illustration", images, caption: body || null };
  }

  if (kind === "note") {
    if (!body && !images.length) return null;
    return { kind: "note", body: body || "", images };
  }

  if (
    kind === "article" ||
    kind === "blog" ||
    kind === "short_post" ||
    kind === "novel"
  ) {
    if (!body && !images.length) return null;
    return {
      kind,
      body: body || "",
      cover: images[0] ?? null,
      images: images.length > 1 ? images.slice(1) : undefined,
    };
  }

  if (
    kind === "video_script" ||
    kind === "short_video" ||
    kind === "podcast" ||
    kind === "music"
  ) {
    if (!body) return null;
    return { kind, body };
  }

  return { kind: "note", body: body || "", images };
}

export function parseWorkPreview(
  raw: unknown,
  options?: { format?: ContentFormatId | null },
): WorkPreview | null {
  if (!isRecord(raw)) return null;

  let content = parsePreviewContent(raw.content);
  if (!content && raw.blocks) {
    const blocks = parsePreviewBlocks(raw.blocks);
    content = migrateBlocksToContent(blocks, options?.format);
  }
  if (!content) return null;

  return {
    title: typeof raw.title === "string" ? raw.title : null,
    hook: typeof raw.hook === "string" ? raw.hook : null,
    hashtags: Array.isArray(raw.hashtags)
      ? raw.hashtags.filter((tag): tag is string => typeof tag === "string")
      : undefined,
    notes: typeof raw.notes === "string" ? raw.notes : null,
    content,
  };
}

export function previewHasContent(preview: WorkPreview | null | undefined): boolean {
  if (!preview?.content) return false;
  const content = preview.content;
  if (content.kind === "illustration") return content.images.length > 0;
  if ("body" in content && content.body.trim()) return true;
  if (content.kind === "note" && content.images.length > 0) return true;
  if ("images" in content && content.images?.length) return true;
  return false;
}

export function previewPlainText(
  preview: WorkPreview | null | undefined,
  maxLength?: number,
): string {
  const content = preview?.content;
  if (!content) return "";
  let text = "";
  if ("body" in content) text = content.body.trim();
  if (content.kind === "illustration" && content.caption?.trim()) {
    text = content.caption.trim();
  }
  if (maxLength != null && text.length > maxLength) {
    return `${text.slice(0, maxLength)}…`;
  }
  return text;
}

export function previewExcerpt(
  preview: WorkPreview | null | undefined,
  maxLength = 120,
): string | null {
  const hook = preview?.hook?.trim();
  if (hook) return hook.length > maxLength ? `${hook.slice(0, maxLength)}…` : hook;
  const plain = previewPlainText(preview, maxLength);
  return plain || null;
}

export function previewImages(
  preview: WorkPreview | null | undefined,
): PreviewImage[] {
  const content = preview?.content;
  if (!content) return [];
  if (content.kind === "illustration") return content.images;
  if (content.kind === "note") return content.images;
  if ("images" in content) {
    const list = [...(content.images ?? [])];
    if ("cover" in content && content.cover) {
      return [content.cover, ...list];
    }
    return list;
  }
  return [];
}

export function previewCoverUrl(
  preview: WorkPreview | null | undefined,
): string | null {
  const images = previewImages(preview);
  return images[0]?.url.trim() || null;
}

/** @deprecated use previewImages */
export function previewHasImages(blocks: PreviewBlock[] | null | undefined): boolean {
  return Boolean(blocks?.some((block) => block.type === "image" && block.url.trim()));
}

/** @deprecated */
export function previewTextLength(blocks: PreviewBlock[] | null | undefined): number {
  return (blocks ?? [])
    .filter((block): block is Extract<PreviewBlock, { type: "text" }> => block.type === "text")
    .reduce((sum, block) => sum + block.markdown.trim().length, 0);
}

function imageFromDraftImage(
  image: ProductionDraftImage,
  taskId: string,
  index: number,
): PreviewImage | null {
  const url = image.url?.trim();
  if (!url) return null;
  return {
    id: `${taskId}:image:${index}`,
    url,
    alt: image.alt ?? null,
    prompt: image.prompt ?? null,
    transient: image.transient === true ? true : undefined,
    taskId,
  };
}

type AssembledParts = {
  textParts: string[];
  images: PreviewImage[];
};

function collectFromTasks(tasks: ProductionTask[]): AssembledParts {
  const textParts: string[] = [];
  const images: PreviewImage[] = [];

  for (const task of tasks) {
    const deliverable = task.deliverable;
    if (!deliverable) continue;
    const department = task.department ?? "writing";

    if (department === "design") {
      const caption =
        deliverable.notes?.trim() || deliverable.title?.trim() || "";
      if (caption) textParts.push(caption);
      (deliverable.images ?? []).forEach((image, index) => {
        const parsed = imageFromDraftImage(image, task.id, index);
        if (parsed) images.push(parsed);
      });
      continue;
    }

    if (department === "audio" || department === "video") {
      const notes = deliverable.notes?.trim();
      if (notes) textParts.push(notes);
      continue;
    }

    const body = deliverable.body?.trim();
    if (body) textParts.push(body);
  }

  return { textParts, images };
}

/** 将已通过验收的任务 deliverable 整理为体裁成稿 */
export function contentFromProductionTasks(
  tasks: ProductionTask[],
  format: ContentFormatId | null | undefined,
): PreviewContent | null {
  const { textParts, images } = collectFromTasks(tasks);
  const body = textParts.filter(Boolean).join("\n\n");
  const kind = defaultPreviewContentKind(format);

  if (kind === "illustration") {
    if (!images.length) return null;
    return { kind: "illustration", images, caption: body || null };
  }

  if (kind === "note") {
    if (!body && !images.length) return null;
    return { kind: "note", body, images };
  }

  if (
    kind === "article" ||
    kind === "blog" ||
    kind === "short_post" ||
    kind === "novel"
  ) {
    if (!body && !images.length) return null;
    return {
      kind,
      body,
      cover: images[0] ?? null,
      images: images.length > 1 ? images.slice(1) : undefined,
    };
  }

  if (!body) return null;
  return { kind, body };
}

/** @deprecated use contentFromProductionTasks */
export function blocksFromProductionTasks(tasks: ProductionTask[]): PreviewBlock[] {
  const { textParts, images } = collectFromTasks(tasks);
  const blocks: PreviewBlock[] = [];
  for (const part of textParts) {
    blocks.push({ id: nanoid(), type: "text", markdown: part, taskId: null });
  }
  for (const image of images) {
    blocks.push({
      id: image.id,
      type: "image",
      url: image.url,
      alt: image.alt ?? null,
      prompt: image.prompt ?? null,
      transient: image.transient,
      taskId: image.taskId ?? null,
    });
  }
  return blocks;
}

export function copyablePreviewText(preview: WorkPreview): string {
  return previewPlainText(preview);
}

/** 供 block-composition 等兼容：从 content 合成虚拟 block 列表 */
export function previewContentToLegacyBlocks(
  preview: WorkPreview | null | undefined,
): PreviewBlock[] {
  const content = preview?.content;
  if (!content) return [];
  const blocks: PreviewBlock[] = [];
  if ("body" in content && content.body.trim()) {
    blocks.push({
      id: "content:body",
      type: "text",
      markdown: content.body,
      taskId: null,
    });
  }
  for (const image of previewImages(preview)) {
    blocks.push({
      id: image.id,
      type: "image",
      url: image.url,
      alt: image.alt ?? null,
      prompt: image.prompt ?? null,
      transient: image.transient,
      taskId: image.taskId ?? null,
    });
  }
  return blocks;
}

export type { PreviewBlock };
