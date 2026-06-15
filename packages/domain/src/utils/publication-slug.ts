import { nanoid } from "nanoid";

/**
 * 公开内容 URL slug。
 * - 含拉丁字符的标题：`kebab-case` + 8 位后缀，如 `hello-world-a1b2c3d4`
 * - 纯中文等无 ASCII 字符：仅 8 位短 id，如 `a1b2c3d4`（避免中文出现在 URL 中）
 */
export function buildPublicationSlug(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  const suffix = nanoid(8);
  return base ? `${base}-${suffix}` : suffix;
}

/** slug 是否为新格式（纯 ASCII，无中文） */
export function isAsciiPublicationSlug(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/i.test(slug);
}
