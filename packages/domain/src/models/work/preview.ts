import type { ContentFormatId } from "../content-form/formats.js";

/** 成稿配图 */
export interface PreviewImage {
  id: string;
  url: string;
  alt?: string | null;
  prompt?: string | null;
  transient?: boolean;
  taskId?: string | null;
}

/** 体裁成稿主体（与 direction.format 对齐） */
export type PreviewContent =
  | NotePreviewContent
  | TextPreviewContent
  | ScriptPreviewContent
  | IllustrationPreviewContent;

export interface NotePreviewContent {
  kind: "note";
  body: string;
  images: PreviewImage[];
}

export interface TextPreviewContent {
  kind: "article" | "blog" | "short_post" | "novel";
  body: string;
  cover?: PreviewImage | null;
  images?: PreviewImage[];
}

export interface ScriptPreviewContent {
  kind: "video_script" | "short_video" | "podcast" | "music";
  body: string;
}

export interface IllustrationPreviewContent {
  kind: "illustration";
  images: PreviewImage[];
  caption?: string | null;
}

export type PreviewContentKind = PreviewContent["kind"];

/** @deprecated 旧 block 模型；读库迁移用 */
export type PreviewBlockType = "text" | "image" | "audio" | "video";

/** @deprecated */
export interface PreviewBlockBase {
  id: string;
  taskId?: string | null;
}

/** @deprecated */
export interface TextPreviewBlock extends PreviewBlockBase {
  type: "text";
  markdown: string;
}

/** @deprecated */
export interface ImagePreviewBlock extends PreviewBlockBase {
  type: "image";
  url: string;
  alt?: string | null;
  prompt?: string | null;
  transient?: boolean;
}

/** @deprecated */
export interface AudioPreviewBlock extends PreviewBlockBase {
  type: "audio";
  url: string;
  title?: string | null;
  durationSec?: number | null;
  transcript?: string | null;
}

/** @deprecated */
export interface VideoPreviewBlock extends PreviewBlockBase {
  type: "video";
  url: string;
  posterUrl?: string | null;
  title?: string | null;
  durationSec?: number | null;
}

/** @deprecated */
export type PreviewBlock =
  | TextPreviewBlock
  | ImagePreviewBlock
  | AudioPreviewBlock
  | VideoPreviewBlock;

/**
 * 作品预览（Work 顶层字段 preview）。
 * 产出后可生成 WorkVersion（kind=preview）。
 */
export interface WorkPreview {
  title?: string | null;
  hook?: string | null;
  hashtags?: string[];
  /** 制作备注（内部说明，默认不进公开展示） */
  notes?: string | null;
  /** 体裁成稿 */
  content?: PreviewContent | null;
}

/** 默认 note 体裁成稿（assemble 兜底） */
export function defaultPreviewContentKind(
  format: ContentFormatId | null | undefined,
): PreviewContentKind {
  if (format === "illustration") return "illustration";
  if (format === "note") return "note";
  if (format === "short_post") return "short_post";
  if (format === "article") return "article";
  if (format === "blog") return "blog";
  if (format === "novel") return "novel";
  if (format === "video_script") return "video_script";
  if (format === "short_video") return "short_video";
  if (format === "podcast") return "podcast";
  if (format === "music") return "music";
  return "note";
}
