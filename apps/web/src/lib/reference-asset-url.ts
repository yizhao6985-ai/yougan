import { API_BASE_URL } from "@/lib/env";

/**
 * 将上传/持久化里的文件 URL 归一化为当前前端所连 API 的地址。
 * 避免 PUBLIC_BASE_URL 与 VITE_API_BASE_URL 不一致时，缩略图请求到错误主机。
 */
export function resolveReferenceAssetUrl(
  url: string | null | undefined,
): string | null {
  if (!url?.trim()) return null;

  const trimmed = url.trim();

  try {
    const pathname = trimmed.startsWith("http")
      ? new URL(trimmed).pathname
      : trimmed.startsWith("/")
        ? trimmed
        : `/api/files/${trimmed}`;

    if (pathname.startsWith("/api/files/")) {
      return `${API_BASE_URL}${pathname}`;
    }

    if (trimmed.startsWith("http")) return trimmed;
    return new URL(trimmed, API_BASE_URL).href;
  } catch {
    return trimmed;
  }
}
