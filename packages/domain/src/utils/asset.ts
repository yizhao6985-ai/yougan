/** 已上传文件的媒介分类（用于上传入口、分析路由与 UI） */
export type MediaKind = "image" | "audio" | "video" | "file";

export function inferMediaKind(
  mime: string | null | undefined,
): MediaKind {
  const normalized = (mime ?? "").trim().toLowerCase();
  if (normalized.startsWith("image/")) return "image";
  if (normalized.startsWith("audio/")) return "audio";
  if (normalized.startsWith("video/")) return "video";
  return "file";
}
