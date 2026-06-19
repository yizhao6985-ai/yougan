/**
 * 受控创作体裁目录。
 * id 与发现页、WorkProfile.direction.format、路由推断共用。
 */

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

export type ContentFormatId = (typeof CONTENT_FORMATS)[number]["id"];
