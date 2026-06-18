/**
 * 创作体裁与媒介原子目录。
 * id 与发现页、WorkProfile.direction.format、路由推断共用。
 */

/** 创作体裁（与 DISCOVER_FORMATS 同 id/label） */
export const CONTENT_FORMATS = [
  { id: "note", label: "图文笔记" },
  { id: "short_post", label: "短帖动态" },
  { id: "article", label: "长文深度" },
  { id: "blog", label: "博客专栏" },
  { id: "novel", label: "小说故事" },
  { id: "video_script", label: "视频脚本" },
  { id: "short_video", label: "短视频" },
  { id: "podcast", label: "播客" },
  { id: "music", label: "音乐音频" },
  { id: "illustration", label: "绘画创作" },
] as const;

/** 媒介原子（混合场景用数组组合，如 ["text", "image"]） */
export const MEDIA_MODALITIES = [
  { id: "text", label: "文字" },
  { id: "image", label: "图片" },
  { id: "audio", label: "音频" },
  { id: "video", label: "视频" },
] as const;

export type ContentFormatId = (typeof CONTENT_FORMATS)[number]["id"];
export type MediaModalityId = (typeof MEDIA_MODALITIES)[number]["id"];
