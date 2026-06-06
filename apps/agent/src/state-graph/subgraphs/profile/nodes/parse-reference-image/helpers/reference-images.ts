/**
 * 参考图 URL 解析与去重（parse-reference-image 与 reference-tools 共用）。
 */
import type { ReferenceItem } from "@yougan/domain";

export function listKnownReferenceImageUrls(references: ReferenceItem[]): string[] {
  return references
    .filter((item) => item.source_type === "image" && item.image_url)
    .map((item) => item.image_url!);
}

function filenameFromUrl(url: string): string {
  try {
    return new URL(url).pathname.split("/").pop() ?? url;
  } catch {
    return url.split("/").pop() ?? url;
  }
}

/** 优先使用用户本条消息里附带的图片 URL，避免模型传入错误或臆造的地址。 */
export function resolveReferenceImageUrl(
  requested: string,
  messageUrls: string[],
  knownUrls: string[] = [],
): string | null {
  const trimmed = requested.trim();
  const known = new Set(knownUrls);

  if (messageUrls.length > 0) {
    if (trimmed && messageUrls.includes(trimmed)) return trimmed;

    if (messageUrls.length === 1) return messageUrls[0]!;

    if (trimmed) {
      const requestedName = filenameFromUrl(trimmed);
      const byName = messageUrls.find(
        (url) => filenameFromUrl(url) === requestedName,
      );
      if (byName) return byName;
    }

    return messageUrls[messageUrls.length - 1]!;
  }

  if (trimmed && known.has(trimmed)) return trimmed;
  return null;
}

export function upsertImageReference(
  references: ReferenceItem[],
  item: ReferenceItem,
): ReferenceItem[] {
  if (item.source_type !== "image" || !item.image_url) {
    return references;
  }

  const refs = [...references];
  const index = refs.findIndex(
    (ref) => ref.source_type === "image" && ref.image_url === item.image_url,
  );

  if (index >= 0) {
    refs[index] = { ...refs[index], ...item };
  } else {
    refs.push(item);
  }

  return refs;
}
