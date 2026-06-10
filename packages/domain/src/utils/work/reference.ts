import type { Asset } from "../../models/work/asset.js";
import { inferMediaKind, type MediaKind } from "../asset.js";
import {
  EMPTY_WORK_REFERENCES,
  PENDING_REFERENCE_INTENT_SUMMARY,
  type ReferenceAnalysis,
  type ReferenceIntent,
  type WorkReference,
} from "../../models/work/reference.js";

export { PENDING_REFERENCE_INTENT_SUMMARY };

function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function newWorkReference(input: {
  asset: Asset;
  analysis: ReferenceAnalysis;
  intent: ReferenceIntent;
  analyzed_at?: string;
  created_at?: string;
  id?: string;
}): WorkReference {
  const timestamp = input.analyzed_at ?? nowIso();
  return {
    id: input.id ?? newId("reference"),
    asset: input.asset,
    analysis: input.analysis,
    intent: input.intent,
    analyzed_at: timestamp,
    created_at: input.created_at ?? timestamp,
  };
}

export function referenceAssetUrl(reference: WorkReference): string | null {
  return reference.asset.url;
}

export function referenceAssetKey(reference: WorkReference): string | null {
  return reference.asset.key;
}

export function isTextReference(reference: WorkReference): boolean {
  return inferMediaKind(reference.asset.mime_type) === "text";
}

export function referenceContentLabel(reference: WorkReference): MediaKind {
  return inferMediaKind(reference.asset.mime_type);
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
      case "txt":
      case "md":
        return "text/plain";
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

function parseReferenceAsset(raw: unknown): Asset | null {
  const direct = parseAsset(raw);
  if (direct) return direct;
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  if (value.kind === "asset") return parseAsset(value.asset);
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
  if (!summary) return null;
  const userContext =
    typeof value.user_context === "string" && value.user_context.trim()
      ? value.user_context.trim()
      : undefined;
  return userContext ? { summary, user_context: userContext } : { summary };
}

export function pendingReferenceIntent(): ReferenceIntent {
  return { summary: PENDING_REFERENCE_INTENT_SUMMARY };
}

export function isPendingReferenceIntent(intent: ReferenceIntent): boolean {
  return intent.summary.trim() === PENDING_REFERENCE_INTENT_SUMMARY;
}

export function referenceNeedsAnalysis(
  url: string,
  references: WorkReference[],
): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  const existing = references.find((item) => item.asset.url === trimmed);
  return !existing?.analysis.summary.trim();
}

export function referenceNeedsIntentSummarize(ref: WorkReference): boolean {
  return Boolean(ref.intent.user_context?.trim());
}

export function referenceNeedsIntentPrompt(ref: WorkReference): boolean {
  return (
    isPendingReferenceIntent(ref.intent) && !ref.intent.user_context?.trim()
  );
}

export function deriveReferenceDelta(
  committed: WorkReference[],
  staging: WorkReference[],
) {
  const committedIds = new Set(committed.map((r) => r.id));
  const stagingIds = new Set(staging.map((r) => r.id));
  return {
    added: staging.filter((r) => !committedIds.has(r.id)),
    removed: committed.filter((r) => !stagingIds.has(r.id)),
    toSummarize: staging.filter(referenceNeedsIntentSummarize),
    toPrompt: staging.filter(referenceNeedsIntentPrompt),
  };
}

function migrateLegacyReference(raw: Record<string, unknown>): WorkReference | null {
  if (
    (raw.asset || raw.content) &&
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

  if (sourceType === "image") {
    const imageUrl =
      typeof raw.image_url === "string" ? raw.image_url.trim() : "";
    if (!imageUrl) return null;
    return newWorkReference({
      asset: assetFromUrl(imageUrl),
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

  const asset =
    parseReferenceAsset(value.asset) ?? parseReferenceAsset(value.content);
  const analysis = parseReferenceAnalysis(value.analysis);
  const intent = parseReferenceIntent(value.intent);
  if (!asset || !analysis || !intent) {
    return migrateLegacyReference(value);
  }

  const analyzedAt =
    typeof value.analyzed_at === "string" ? value.analyzed_at : nowIso();
  const createdAt =
    typeof value.created_at === "string" ? value.created_at : analyzedAt;

  return {
    id: typeof value.id === "string" ? value.id : newId("reference"),
    asset,
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

export function listReferenceAssetUrls(references: WorkReference[]): string[] {
  return references
    .map(referenceAssetUrl)
    .filter((url): url is string => Boolean(url));
}

