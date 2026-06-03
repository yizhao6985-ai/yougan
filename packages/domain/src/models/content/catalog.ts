/** 创作体裁（与发现页 DISCOVER_FORMATS 同 id/label） */
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
] as const;

/** 媒介形式（与发现页 DISCOVER_MEDIA_TYPES 同 id/label） */
export const MEDIA_MODALITIES = [
  { id: "text", label: "纯文字" },
  { id: "image", label: "图文" },
  { id: "audio", label: "音频" },
  { id: "video", label: "视频" },
  { id: "mixed", label: "混合" },
] as const;

export type ContentFormatId = (typeof CONTENT_FORMATS)[number]["id"];
export type MediaModalityId = (typeof MEDIA_MODALITIES)[number]["id"];
