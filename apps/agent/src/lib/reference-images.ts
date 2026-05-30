import type { BaseMessage } from "@langchain/core/messages";

import type { ReferenceItem, WorkProfile } from "../schemas.js";

export function extractImageUrlsFromHumanContent(content: unknown): string[] {
  if (!Array.isArray(content)) return [];

  const urls: string[] = [];
  for (const part of content) {
    if (!part || typeof part !== "object") continue;
    const block = part as {
      type?: string;
      image_url?: string | { url?: string };
    };
    if (block.type !== "image_url") continue;

    const raw = block.image_url;
    const url = typeof raw === "string" ? raw : raw?.url;
    if (url) urls.push(url);
  }
  return urls;
}

export function getLatestHumanMessageImageUrls(
  messages: BaseMessage[] | undefined,
): string[] {
  if (!messages?.length) return [];

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.getType() !== "human") continue;
    return extractImageUrlsFromHumanContent(message.content);
  }
  return [];
}

export function listKnownReferenceImageUrls(profile: WorkProfile): string[] {
  return (profile.references ?? [])
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
      const byName = messageUrls.find((url) =>
        filenameFromUrl(url) === requestedName,
      );
      if (byName) return byName;
    }

    return messageUrls[messageUrls.length - 1]!;
  }

  if (trimmed && known.has(trimmed)) return trimmed;
  return null;
}

export function upsertImageReference(
  profile: WorkProfile,
  item: ReferenceItem,
): WorkProfile {
  if (item.source_type !== "image" || !item.image_url) {
    return profile;
  }

  const refs = [...(profile.references ?? [])];
  const index = refs.findIndex(
    (ref) => ref.source_type === "image" && ref.image_url === item.image_url,
  );

  if (index >= 0) {
    refs[index] = { ...refs[index], ...item };
  } else {
    refs.push(item);
  }

  return { ...profile, references: refs };
}
