import { nanoid } from "nanoid";

import type { ContentFormatId } from "../../models/content-form/formats.js";
import { isValidContentFormat } from "../content-form-resolve.js";
import type { ProductionDraftImage } from "../../models/work/production-draft.js";
import type {
  IllustrationPreviewContent,
  NotePreviewContent,
  PreviewContent,
  PreviewContentPayload,
  PreviewImage,
  ScriptPreviewContent,
  ScriptSegment,
  TextPreviewContent,
  WorkPreview,
} from "../../models/work/preview.js";
import {
  defaultPreviewContentKind,
  isScriptPreviewKind,
} from "../../models/work/preview.js";
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

function parseScriptSegment(raw: unknown, index: number): ScriptSegment | null {
  if (!isRecord(raw)) return null;
  const body = typeof raw.body === "string" ? raw.body.trim() : "";
  if (!body) return null;
  return {
    id:
      typeof raw.id === "string" && raw.id.trim()
        ? raw.id.trim()
        : `segment:${index}`,
    label: typeof raw.label === "string" ? raw.label : null,
    body,
    durationSec:
      typeof raw.durationSec === "number" ? raw.durationSec : null,
  };
}

export function normalizeScriptSegments(
  segments: ScriptSegment[] | undefined,
  body?: string | null,
): ScriptSegment[] {
  if (segments?.length) {
    return segments
      .map((segment, index) => ({
        id: segment.id?.trim() || `segment:${index}`,
        label: segment.label ?? null,
        body: segment.body.trim(),
        durationSec: segment.durationSec ?? null,
      }))
      .filter((segment) => segment.body);
  }

  const text = body?.trim();
  if (!text) return [];

  return text
    .split(/\n\n+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part, index) => ({
      id: `segment:${index}`,
      body: part,
    }));
}

export function scriptPlainText(content: ScriptPreviewContent): string {
  const cached = content.body?.trim();
  if (cached) return cached;
  return content.segments
    .map((segment) => segment.body.trim())
    .filter(Boolean)
    .join("\n\n");
}

function parseContentPayload(raw: Record<string, unknown>): PreviewContentPayload {
  const segments = Array.isArray(raw.segments)
    ? raw.segments
        .map((item, index) => parseScriptSegment(item, index))
        .filter((item): item is ScriptSegment => item !== null)
    : undefined;

  const legacyCover = parsePreviewImage(raw.cover);
  const images = parsePreviewImages(raw.images);
  const mergedImages =
    legacyCover &&
    !images.some(
      (image) => image.id === legacyCover.id || image.url === legacyCover.url,
    )
      ? [legacyCover, ...images]
      : images;

  return {
    body: typeof raw.body === "string" ? raw.body : undefined,
    images: mergedImages,
    caption: typeof raw.caption === "string" ? raw.caption : null,
    segments,
  };
}

function resolveContentFormat(
  format: ContentFormatId | null | undefined,
  raw: Record<string, unknown>,
): ContentFormatId | null {
  if (format) return format;
  const kind = typeof raw.kind === "string" ? raw.kind : "";
  return isValidContentFormat(kind) ? kind : null;
}

/** 按 profile.format 组装成稿（kind 由 format 决定） */
export function buildPreviewContent(
  format: ContentFormatId | null | undefined,
  payload: PreviewContentPayload,
): PreviewContent | null {
  const kind = defaultPreviewContentKind(format);

  if (kind === "illustration") {
    const images = payload.images ?? [];
    if (!images.length) return null;
    return {
      kind: "illustration",
      images,
      caption: payload.caption?.trim() || payload.body?.trim() || null,
    };
  }

  if (kind === "note") {
    const body = payload.body?.trim() ?? "";
    const images = payload.images ?? [];
    if (!body && !images.length) return null;
    return { kind: "note", body, images };
  }

  if (
    kind === "article" ||
    kind === "blog" ||
    kind === "short_post" ||
    kind === "novel"
  ) {
    const body = payload.body?.trim() ?? "";
    const images = payload.images ?? [];
    if (!body && !images.length) return null;
    return {
      kind,
      body,
      images: images.length ? images : undefined,
    };
  }

  if (isScriptPreviewKind(kind)) {
    const segments = normalizeScriptSegments(payload.segments, payload.body);
    if (!segments.length) return null;
    const body = payload.body?.trim() || scriptPlainText({ kind, segments });
    return { kind, segments, body };
  }

  return null;
}

export function parsePreviewContent(
  raw: unknown,
  format?: ContentFormatId | null,
): PreviewContent | null {
  if (!isRecord(raw)) return null;
  const resolvedFormat = resolveContentFormat(format, raw);
  if (!resolvedFormat) return null;
  return buildPreviewContent(resolvedFormat, parseContentPayload(raw));
}

export function parseWorkPreview(
  raw: unknown,
  options?: { format?: ContentFormatId | null },
): WorkPreview | null {
  if (!isRecord(raw)) return null;

  const content = parsePreviewContent(raw.content, options?.format);
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
  if (content.kind === "note") {
    return Boolean(content.body.trim()) || content.images.length > 0;
  }
  if ("segments" in content && content.segments.length > 0) {
    return content.segments.some((segment) => segment.body.trim());
  }
  if ("body" in content && content.body?.trim()) return true;
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
  if ("segments" in content) {
    text = scriptPlainText(content);
  } else if ("body" in content && typeof content.body === "string") {
    text = content.body.trim();
  }
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
  if ("images" in content) return content.images ?? [];
  return [];
}

export function previewHasImages(
  preview: WorkPreview | null | undefined,
): boolean {
  return previewImages(preview).length > 0;
}

export function previewTextLength(
  preview: WorkPreview | null | undefined,
): number {
  return previewPlainText(preview).length;
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
      images: images.length ? images : undefined,
    };
  }

  if (isScriptPreviewKind(kind)) {
    const segments = normalizeScriptSegments(undefined, body);
    if (!segments.length) return null;
    return { kind, segments, body };
  }

  return null;
}

export function copyablePreviewText(preview: WorkPreview): string {
  return previewPlainText(preview);
}
