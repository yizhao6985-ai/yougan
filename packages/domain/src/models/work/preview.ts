import type { ContentFormatId } from "../content-form/formats.js";

/** 成稿正文块 ID（改稿锚点、选区引用） */
export const PREVIEW_BODY_BLOCK_ID = "content:body" as const;

/** 成稿配图 */
export interface PreviewImage {
  id: string;
  url: string;
  alt?: string | null;
  prompt?: string | null;
  transient?: boolean;
  taskId?: string | null;
}

/** 脚本/口播分段 */
export interface ScriptSegment {
  id: string;
  label?: string | null;
  body: string;
  durationSec?: number | null;
}

/** 体裁成稿主体（kind 由 profile.direction.format 决定，写入时对齐） */
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
  images?: PreviewImage[];
}

export interface ScriptPreviewContent {
  kind: "video_script" | "short_video" | "podcast" | "music";
  segments: ScriptSegment[];
  /** segments 拼接结果，供摘要/搜索；写入时同步 */
  body?: string;
}

export interface IllustrationPreviewContent {
  kind: "illustration";
  images: PreviewImage[];
  caption?: string | null;
}

export type PreviewContentKind = PreviewContent["kind"];

/** LLM / 改稿输出用：不含 kind，由 format 决定形态 */
export type PreviewContentPayload = {
  body?: string;
  images?: PreviewImage[];
  caption?: string | null;
  segments?: ScriptSegment[];
};

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

export function isScriptPreviewKind(
  kind: PreviewContentKind,
): kind is ScriptPreviewContent["kind"] {
  return (
    kind === "video_script" ||
    kind === "short_video" ||
    kind === "podcast" ||
    kind === "music"
  );
}
