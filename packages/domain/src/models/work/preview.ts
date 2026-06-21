/** 产物块类型：按数组顺序在 Studio / 发现页纵向展示 */
export type PreviewBlockType = "text" | "image" | "audio" | "video";

export interface PreviewBlockBase {
  id: string;
  taskId?: string | null;
}

export interface TextPreviewBlock extends PreviewBlockBase {
  type: "text";
  markdown: string;
}

/** 设计任务成图；transient 由 API 物化后剥离 */
export interface ImagePreviewBlock extends PreviewBlockBase {
  type: "image";
  url: string;
  alt?: string | null;
  prompt?: string | null;
  transient?: boolean;
}

export interface AudioPreviewBlock extends PreviewBlockBase {
  type: "audio";
  url: string;
  title?: string | null;
  durationSec?: number | null;
  transcript?: string | null;
}

export interface VideoPreviewBlock extends PreviewBlockBase {
  type: "video";
  url: string;
  posterUrl?: string | null;
  title?: string | null;
  durationSec?: number | null;
}

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
  blocks: PreviewBlock[];
}
