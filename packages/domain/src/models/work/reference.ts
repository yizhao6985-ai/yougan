import type { Asset } from "./asset.js";

/**
 * 参考素材内容。
 * - text：用户粘贴的参考文案
 * - asset：已上传的图片 / 音频 / 视频等文件
 */
export type ReferenceContent =
  | { kind: "text"; text: string }
  | { kind: "asset"; asset: Asset };

/**
 * 对参考素材的客观分析（感知 + 归纳结果）。
 * 写入侧栏「参考素材」，并注入 profile / production prompt。
 */
export interface ReferenceAnalysis {
  /** 面向创作的可读摘要（主展示字段） */
  summary: string;
  keywords?: string[];
  /** 语气线索，如「轻松」「克制」 */
  tone_hints?: string[];
  /** 风格线索，如「纪实」「高饱和」 */
  style_hints?: string[];
  /** 结构线索，如「三段式」「钩子-案例-收尾」 */
  structure_hints?: string[];
  /** ASR 转写稿（音频/视频），供下游引用 */
  transcript?: string;
  /** 视觉感知摘要（图片/视频关键帧） */
  visual_cues?: string;
}

/**
 * 用户希望如何借鉴该参考（LLM 归纳，非用户原话）。
 */
export interface ReferenceIntent {
  summary: string;
}

/**
 * 作品级参考素材条目。
 * 由 reference 子图写入 staging.references，turn.commit 提交到 state 顶层。
 */
export interface WorkReference {
  id: string;
  content: ReferenceContent;
  analysis: ReferenceAnalysis;
  intent: ReferenceIntent;
  /** 最近一次完成分析的时间（ISO） */
  analyzed_at: string;
  created_at: string;
}

export const EMPTY_WORK_REFERENCES: WorkReference[] = [];

/** @deprecated Use WorkReference */
export type ReferenceItem = WorkReference;
