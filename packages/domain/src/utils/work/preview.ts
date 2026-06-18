import { nanoid } from "nanoid";

import type {
  ImagePreviewBlock,
  PreviewBlock,
  PreviewBlockType,
  WorkPreview,
  WorkPreviewImage,
} from "../../models/work/preview.js";
import type { ProductionTask } from "../../models/work/production.js";

const BLOCK_TYPES = new Set<string>(["text", "image", "audio", "video"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function parseTextBlock(raw: Record<string, unknown>): TextPreviewBlock | null {
  const markdown =
    typeof raw.markdown === "string" ? raw.markdown.trim() : "";
  if (!markdown) return null;
  const id = typeof raw.id === "string" && raw.id.trim() ? raw.id : nanoid();
  return {
    id,
    type: "text",
    markdown,
    taskId: typeof raw.taskId === "string" ? raw.taskId : null,
  };
}

type TextPreviewBlock = Extract<PreviewBlock, { type: "text" }>;

function parseImageBlock(
  raw: Record<string, unknown>,
): ImagePreviewBlock | null {
  const url = typeof raw.url === "string" ? raw.url.trim() : "";
  if (!url) return null;
  const id = typeof raw.id === "string" && raw.id.trim() ? raw.id : nanoid();
  return {
    id,
    type: "image",
    url,
    alt: typeof raw.alt === "string" ? raw.alt : null,
    prompt: typeof raw.prompt === "string" ? raw.prompt : null,
    transient: raw.transient === true ? true : undefined,
    taskId: typeof raw.taskId === "string" ? raw.taskId : null,
  };
}

function parseAudioBlock(raw: Record<string, unknown>): PreviewBlock | null {
  const url = typeof raw.url === "string" ? raw.url.trim() : "";
  if (!url) return null;
  const id = typeof raw.id === "string" && raw.id.trim() ? raw.id : nanoid();
  return {
    id,
    type: "audio",
    url,
    title: typeof raw.title === "string" ? raw.title : null,
    durationSec: typeof raw.durationSec === "number" ? raw.durationSec : null,
    transcript: typeof raw.transcript === "string" ? raw.transcript : null,
    taskId: typeof raw.taskId === "string" ? raw.taskId : null,
  };
}

function parseVideoBlock(raw: Record<string, unknown>): PreviewBlock | null {
  const url = typeof raw.url === "string" ? raw.url.trim() : "";
  if (!url) return null;
  const id = typeof raw.id === "string" && raw.id.trim() ? raw.id : nanoid();
  return {
    id,
    type: "video",
    url,
    posterUrl: typeof raw.posterUrl === "string" ? raw.posterUrl : null,
    title: typeof raw.title === "string" ? raw.title : null,
    durationSec: typeof raw.durationSec === "number" ? raw.durationSec : null,
    taskId: typeof raw.taskId === "string" ? raw.taskId : null,
  };
}

export function parsePreviewBlock(raw: unknown): PreviewBlock | null {
  if (!isRecord(raw)) return null;
  const type = typeof raw.type === "string" ? raw.type : "";
  if (!BLOCK_TYPES.has(type)) return null;

  switch (type as PreviewBlockType) {
    case "text":
      return parseTextBlock(raw);
    case "image":
      return parseImageBlock(raw);
    case "audio":
      return parseAudioBlock(raw);
    case "video":
      return parseVideoBlock(raw);
    default:
      return null;
  }
}

export function parsePreviewBlocks(raw: unknown): PreviewBlock[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => parsePreviewBlock(item))
    .filter((item): item is PreviewBlock => item !== null);
}

export function parseWorkPreview(raw: unknown): WorkPreview | null {
  if (!isRecord(raw)) return null;

  const blocks = parsePreviewBlocks(raw.blocks);
  if (!blocks.length) return null;

  return {
    title: typeof raw.title === "string" ? raw.title : null,
    hook: typeof raw.hook === "string" ? raw.hook : null,
    hashtags: Array.isArray(raw.hashtags)
      ? raw.hashtags.filter((tag): tag is string => typeof tag === "string")
      : undefined,
    notes: typeof raw.notes === "string" ? raw.notes : null,
    blocks,
  };
}

export function previewHasContent(preview: WorkPreview | null | undefined): boolean {
  return Boolean(preview?.blocks?.length);
}

export function previewPlainText(
  preview: WorkPreview | null | undefined,
  maxLength?: number,
): string {
  if (!preview?.blocks?.length) return "";
  const parts = preview.blocks.flatMap((block) => {
    if (block.type === "text") return [block.markdown.trim()];
    if (block.type === "audio" && block.transcript?.trim()) {
      return [block.transcript.trim()];
    }
    return [];
  });
  const text = parts.filter(Boolean).join("\n\n");
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

export function previewCoverUrl(
  preview: WorkPreview | null | undefined,
): string | null {
  if (!preview?.blocks?.length) return null;
  for (const block of preview.blocks) {
    if (block.type === "image" && block.url.trim()) return block.url.trim();
    if (block.type === "video" && block.posterUrl?.trim()) {
      return block.posterUrl.trim();
    }
  }
  return null;
}

export function previewBlockTypeCounts(
  blocks: PreviewBlock[] | null | undefined,
): Partial<Record<PreviewBlockType, number>> {
  const counts: Partial<Record<PreviewBlockType, number>> = {};
  for (const block of blocks ?? []) {
    counts[block.type] = (counts[block.type] ?? 0) + 1;
  }
  return counts;
}

export function previewHasImages(blocks: PreviewBlock[] | null | undefined): boolean {
  return Boolean(
    blocks?.some((block) => block.type === "image" && block.url.trim()),
  );
}

export function previewTextLength(blocks: PreviewBlock[] | null | undefined): number {
  return (blocks ?? [])
    .filter((block): block is TextPreviewBlock => block.type === "text")
    .reduce((sum, block) => sum + block.markdown.trim().length, 0);
}

function imageBlockFromDeliverable(
  image: WorkPreviewImage,
  taskId: string,
  index: number,
): ImagePreviewBlock | null {
  const url = image.url?.trim();
  if (!url) return null;
  return {
    id: `${taskId}:image:${index}`,
    type: "image",
    url,
    alt: image.alt ?? null,
    prompt: image.prompt ?? null,
    transient: image.transient === true ? true : undefined,
    taskId,
  };
}

/** 将已通过验收的任务 deliverable 按顺序映射为 preview blocks */
export function blocksFromProductionTasks(
  tasks: ProductionTask[],
): PreviewBlock[] {
  const blocks: PreviewBlock[] = [];

  for (const task of tasks) {
    const deliverable = task.deliverable;
    if (!deliverable) continue;

    const department = task.department ?? "writing";

    if (department === "design") {
      const caption =
        deliverable.notes?.trim() ||
        deliverable.title?.trim() ||
        null;
      if (caption) {
        blocks.push({
          id: `${task.id}:caption`,
          type: "text",
          markdown: caption,
          taskId: task.id,
        });
      }

      const images = deliverable.images ?? [];
      images.forEach((image, index) => {
        const block = imageBlockFromDeliverable(image, task.id, index);
        if (block) blocks.push(block);
      });
      continue;
    }

    if (department === "audio") {
      const url = deliverable.body?.trim();
      if (url) {
        blocks.push({
          id: `${task.id}:audio`,
          type: "audio",
          url,
          title: deliverable.title ?? null,
          transcript: deliverable.notes ?? null,
          taskId: task.id,
        });
      }
      continue;
    }

    if (department === "video") {
      const url = deliverable.body?.trim();
      if (url) {
        blocks.push({
          id: `${task.id}:video`,
          type: "video",
          url,
          title: deliverable.title ?? null,
          taskId: task.id,
        });
      }
      continue;
    }

    const body = deliverable.body?.trim();
    if (body) {
      blocks.push({
        id: `${task.id}:text`,
        type: "text",
        markdown: body,
        taskId: task.id,
      });
    }
  }

  return blocks;
}

export function copyablePreviewText(preview: WorkPreview): string {
  return previewPlainText(preview);
}
