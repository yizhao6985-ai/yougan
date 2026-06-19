/** 受控媒介原子目录（混合场景用数组组合，如 ["text", "image"]） */
export const MEDIA_MODALITIES = [
  { id: "text", label: "文字" },
  { id: "image", label: "图片" },
  { id: "audio", label: "音频" },
  { id: "video", label: "视频" },
] as const;

export type MediaModalityId = (typeof MEDIA_MODALITIES)[number]["id"];
