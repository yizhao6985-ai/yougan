import type { Asset } from "../../models/work/asset.js";
import { inferMediaKind, type MediaKind } from "../asset.js";
import {
  EMPTY_WORK_REFERENCES,
  type ReferenceAnalysis,
  type ReferenceContent,
  type ReferenceIntent,
  type WorkReference,
} from "../../models/work/reference.js";

function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function newWorkReference(input: {
  content: ReferenceContent;
  analysis: ReferenceAnalysis;
  intent: ReferenceIntent;
  analyzed_at?: string;
  created_at?: string;
  id?: string;
}): WorkReference {
  const timestamp = input.analyzed_at ?? nowIso();
  return {
    id: input.id ?? newId("reference"),
    content: input.content,
    analysis: input.analysis,
    intent: input.intent,
    analyzed_at: timestamp,
    created_at: input.created_at ?? timestamp,
  };
}

export function referenceAssetUrl(reference: WorkReference): string | null {
  if (reference.content.kind !== "asset") return null;
  return reference.content.asset.url;
}

export function referenceAssetKey(reference: WorkReference): string | null {
  if (reference.content.kind !== "asset") return null;
  return reference.content.asset.key;
}

export function isAssetReference(reference: WorkReference): boolean {
  return reference.content.kind === "asset";
}

export function isTextReference(reference: WorkReference): boolean {
  return reference.content.kind === "text";
}

export function referenceContentLabel(
  reference: WorkReference,
): "text" | MediaKind {
  if (reference.content.kind === "text") return "text";
  return inferMediaKind(reference.content.asset.mime_type);
}

export function assetFromUrl(
  url: string,
  partial?: Partial<Pick<Asset, "key" | "mime_type" | "size_bytes" | "original_name">>,
): Asset {
  const trimmed = url.trim();
  const keyFromUrl = (() => {
    const marker = "/api/files/";
    const index = trimmed.indexOf(marker);
    if (index >= 0) return trimmed.slice(index + marker.length);
    try {
      const parsed = new URL(trimmed);
      const pathMarker = "/api/files/";
      const pathIndex = parsed.pathname.indexOf(pathMarker);
      if (pathIndex >= 0) {
        return parsed.pathname.slice(pathIndex + pathMarker.length);
      }
      return parsed.pathname.replace(/^\//, "");
    } catch {
      return trimmed;
    }
  })();

  const ext = keyFromUrl.split(".").pop()?.toLowerCase();
  const mimeFromExt = (() => {
    switch (ext) {
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "webp":
        return "image/webp";
      case "gif":
        return "image/gif";
      case "mp3":
        return "audio/mpeg";
      case "wav":
        return "audio/wav";
      case "ogg":
        return "audio/ogg";
      case "m4a":
        return "audio/mp4";
      case "mp4":
      case "m4v":
        return "video/mp4";
      case "webm":
        return "video/webm";
      case "mov":
        return "video/quicktime";
      default:
        return "application/octet-stream";
    }
  })();

  return {
    key: partial?.key?.trim() || keyFromUrl,
    url: trimmed,
    mime_type: partial?.mime_type?.trim() || mimeFromExt,
    size_bytes: partial?.size_bytes ?? null,
    original_name: partial?.original_name ?? null,
  };
}

function parseAsset(raw: unknown): Asset | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const key = typeof value.key === "string" ? value.key.trim() : "";
  const url = typeof value.url === "string" ? value.url.trim() : "";
  const mimeType =
    typeof value.mime_type === "string" ? value.mime_type.trim() : "";
  if (!key || !url || !mimeType) return null;
  return {
    key,
    url,
    mime_type: mimeType,
    size_bytes:
      typeof value.size_bytes === "number" ? value.size_bytes : null,
    original_name:
      typeof value.original_name === "string" ? value.original_name : null,
  };
}

function parseReferenceContent(raw: unknown): ReferenceContent | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  if (value.kind === "text" && typeof value.text === "string") {
    const text = value.text.trim();
    return text ? { kind: "text", text } : null;
  }
  if (value.kind === "asset") {
    const asset = parseAsset(value.asset);
    return asset ? { kind: "asset", asset } : null;
  }
  return null;
}

function parseReferenceAnalysis(raw: unknown): ReferenceAnalysis | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const summary = typeof value.summary === "string" ? value.summary.trim() : "";
  if (!summary) return null;
  return {
    summary,
    keywords: Array.isArray(value.keywords)
      ? value.keywords.filter((item): item is string => typeof item === "string")
      : undefined,
    tone_hints: Array.isArray(value.tone_hints)
      ? value.tone_hints.filter((item): item is string => typeof item === "string")
      : undefined,
    style_hints: Array.isArray(value.style_hints)
      ? value.style_hints.filter((item): item is string => typeof item === "string")
      : undefined,
    structure_hints: Array.isArray(value.structure_hints)
      ? value.structure_hints.filter(
          (item): item is string => typeof item === "string",
        )
      : undefined,
    transcript:
      typeof value.transcript === "string" && value.transcript.trim()
        ? value.transcript.trim()
        : undefined,
    visual_cues:
      typeof value.visual_cues === "string" && value.visual_cues.trim()
        ? value.visual_cues.trim()
        : undefined,
  };
}

function parseReferenceIntent(raw: unknown): ReferenceIntent | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const summary = typeof value.summary === "string" ? value.summary.trim() : "";
  return summary ? { summary } : null;
}

function migrateLegacyReference(raw: Record<string, unknown>): WorkReference | null {
  if (
    raw.content &&
    raw.analysis &&
    raw.intent &&
    typeof raw.id === "string"
  ) {
    return parseWorkReference(raw);
  }

  const sourceType = raw.source_type;
  const summary = typeof raw.summary === "string" ? raw.summary.trim() : "";
  if (!summary) return null;

  const timestamp = nowIso();
  const analysis: ReferenceAnalysis = {
    summary,
    keywords: Array.isArray(raw.keywords)
      ? raw.keywords.filter((item): item is string => typeof item === "string")
      : undefined,
    tone_hints: Array.isArray(raw.tone_hints)
      ? raw.tone_hints.filter((item): item is string => typeof item === "string")
      : undefined,
    structure_hints: Array.isArray(raw.structure_hints)
      ? raw.structure_hints.filter((item): item is string => typeof item === "string")
      : undefined,
  };
  const intent: ReferenceIntent = {
    summary: "历史参考素材，使用意图未单独记录。",
  };

  if (sourceType === "text") {
    const text =
      typeof raw.raw_excerpt === "string" && raw.raw_excerpt.trim()
        ? raw.raw_excerpt.trim()
        : summary;
    return newWorkReference({
      content: { kind: "text", text },
      analysis,
      intent,
      analyzed_at: timestamp,
      created_at: timestamp,
    });
  }

  if (sourceType === "image") {
    const imageUrl =
      typeof raw.image_url === "string" ? raw.image_url.trim() : "";
    if (!imageUrl) return null;
    return newWorkReference({
      content: { kind: "asset", asset: assetFromUrl(imageUrl) },
      analysis,
      intent,
      analyzed_at: timestamp,
      created_at: timestamp,
    });
  }

  return null;
}

export function parseWorkReference(raw: unknown): WorkReference | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;

  const content = parseReferenceContent(value.content);
  const analysis = parseReferenceAnalysis(value.analysis);
  const intent = parseReferenceIntent(value.intent);
  if (!content || !analysis || !intent) {
    return migrateLegacyReference(value);
  }

  const analyzedAt =
    typeof value.analyzed_at === "string" ? value.analyzed_at : nowIso();
  const createdAt =
    typeof value.created_at === "string" ? value.created_at : analyzedAt;

  return {
    id: typeof value.id === "string" ? value.id : newId("reference"),
    content,
    analysis,
    intent,
    analyzed_at: analyzedAt,
    created_at: createdAt,
  };
}

export function parseReferencesJson(raw: unknown): WorkReference[] {
  if (!Array.isArray(raw)) return [...EMPTY_WORK_REFERENCES];
  return raw
    .map((item) => parseWorkReference(item))
    .filter((item): item is WorkReference => item != null);
}

export function appendWorkReferences(
  references: WorkReference[],
  items: WorkReference[],
): WorkReference[] {
  if (!items.length) return references;
  return [...references, ...items];
}

export function upsertAssetReference(
  references: WorkReference[],
  item: WorkReference,
): WorkReference[] {
  if (item.content.kind !== "asset") {
    return appendWorkReferences(references, [item]);
  }
  const url = item.content.asset.url;
  const refs = [...references];
  const index = refs.findIndex(
    (ref) => ref.content.kind === "asset" && ref.content.asset.url === url,
  );
  if (index >= 0) {
    refs[index] = { ...item, id: refs[index]!.id, created_at: refs[index]!.created_at };
    return refs;
  }
  return [...refs, item];
}

export function listReferenceAssetUrls(references: WorkReference[]): string[] {
  return references
    .map(referenceAssetUrl)
    .filter((url): url is string => Boolean(url));
}

export function deleteWorkReference(
  references: WorkReference[],
  target: { reference_id?: string; asset_url?: string; index?: number },
): WorkReference[] | null {
  if (!references.length) return null;
  const removeAt = findReferenceIndex(references, target);
  if (removeAt < 0) return null;
  return references.filter((_, i) => i !== removeAt);
}

export function applyReferenceDeletes(
  references: WorkReference[],
  targets: Array<{ reference_id?: string; index?: number; asset_url?: string }>,
): { references: WorkReference[]; deleted: number; warnings: string[] } {
  let next = references;
  let deleted = 0;
  const warnings: string[] = [];

  const byIdOrUrl = targets.filter(
    (t) => t.reference_id?.trim() || t.asset_url?.trim(),
  );
  const byIndex = targets
    .filter(
      (t) =>
        t.index != null && !t.reference_id?.trim() && !t.asset_url?.trim(),
    )
    .map((t) => t.index!)
    .sort((a, b) => b - a);

  for (const target of byIdOrUrl) {
    const result = deleteWorkReference(next, target);
    if (result) {
      next = result;
      deleted++;
    } else {
      warnings.push(
        `未找到参考素材 ${target.reference_id ?? target.asset_url ?? ""}`.trim(),
      );
    }
  }

  for (const index of byIndex) {
    const result = deleteWorkReference(next, { index });
    if (result) {
      next = result;
      deleted++;
    } else {
      warnings.push(`未找到下标 ${index} 的参考素材`);
    }
  }

  for (const _ of targets.filter(
    (t) =>
      t.index == null && !t.reference_id?.trim() && !t.asset_url?.trim(),
  )) {
    warnings.push("删除项须提供 reference_id、index 或 asset_url");
  }

  return { references: next, deleted, warnings };
}

export function findReferenceIndex(
  references: WorkReference[],
  target: { reference_id?: string; index?: number; asset_url?: string },
): number {
  const { reference_id, index, asset_url } = target;
  if (typeof index === "number" && index >= 0 && index < references.length) {
    return index;
  }
  if (reference_id?.trim()) {
    const id = reference_id.trim();
    return references.findIndex((item) => item.id === id);
  }
  if (asset_url?.trim()) {
    const url = asset_url.trim();
    return references.findIndex(
      (item) =>
        item.content.kind === "asset" && item.content.asset.url === url,
    );
  }
  return -1;
}
