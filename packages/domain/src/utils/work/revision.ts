import { nanoid } from "nanoid";

import {
  EMPTY_WORK_REVISION,
  type RevisionAnchor,
  type RevisionIntent,
  type RevisionIntentSource,
  type WorkRevision,
} from "../../models/work/revision.js";
import { normalizeProfileTextField } from "./profile.js";

/** 改稿引用原文：过滤 null / "null" 等无效占位。 */
export function normalizeRevisionQuote(value: unknown): string | null {
  return normalizeProfileTextField(value);
}

function sanitizeRevisionAnchor(
  anchor: RevisionAnchor | null | undefined,
): RevisionAnchor | null {
  if (!anchor) return null;
  const blockId = anchor.blockId.trim();
  const quote = normalizeRevisionQuote(anchor.quote);
  if (!blockId || !quote) return null;
  return {
    ...anchor,
    blockId,
    quote,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function parseRevisionAnchor(raw: unknown): RevisionAnchor | null {
  if (!isRecord(raw)) return null;
  const blockId = typeof raw.blockId === "string" ? raw.blockId.trim() : "";
  const quote = normalizeRevisionQuote(raw.quote);
  if (!blockId || !quote) return null;
  return {
    blockId,
    quote,
    startOffset:
      typeof raw.startOffset === "number" ? raw.startOffset : null,
    endOffset: typeof raw.endOffset === "number" ? raw.endOffset : null,
  };
}

function parseRevisionIntent(raw: unknown): RevisionIntent | null {
  if (!isRecord(raw)) return null;
  const instruction =
    typeof raw.instruction === "string" ? raw.instruction.trim() : "";
  if (!instruction) return null;
  const id =
    typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : nanoid();
  const source = raw.source;
  const parsedSource: RevisionIntentSource =
    source === "selection" || source === "manual" ? source : "chat";
  return {
    id,
    instruction,
    source: parsedSource,
    created_at:
      typeof raw.created_at === "string" ? raw.created_at : new Date().toISOString(),
    anchor: raw.anchor ? parseRevisionAnchor(raw.anchor) : null,
    status: raw.status === "withdrawn" ? "withdrawn" : "open",
  };
}

export function parseRevisionJson(raw: unknown): WorkRevision {
  if (!raw || typeof raw !== "object") {
    return { ...EMPTY_WORK_REVISION };
  }
  const value = raw as WorkRevision;
  const status =
    value.status === "ready" || value.status === "applying"
      ? value.status
      : "collecting";
  const items = Array.isArray(value.items)
    ? value.items
        .map((item) => parseRevisionIntent(item))
        .filter((item): item is RevisionIntent => item !== null)
        .filter((item) => item.status !== "withdrawn")
    : [];
  return {
    baselineVersionId:
      typeof value.baselineVersionId === "string"
        ? value.baselineVersionId
        : null,
    status,
    items,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : null,
  };
}

export function openRevisionItems(revision: WorkRevision | null | undefined) {
  return (revision?.items ?? []).filter((item) => item.status !== "withdrawn");
}

export function hasOpenRevisionItems(
  revision: WorkRevision | null | undefined,
): boolean {
  return openRevisionItems(revision).length > 0;
}

export function appendRevisionIntent(
  revision: WorkRevision,
  input: {
    instruction: string;
    anchor?: RevisionAnchor | null;
    source?: RevisionIntentSource;
  },
): WorkRevision {
  const item: RevisionIntent = {
    id: nanoid(),
    instruction: input.instruction.trim(),
    anchor: sanitizeRevisionAnchor(input.anchor),
    source: input.source ?? "manual",
    created_at: new Date().toISOString(),
    status: "open",
  };
  return {
    ...revision,
    status: "collecting",
    items: [...revision.items, item],
    updatedAt: new Date().toISOString(),
  };
}

export function clearRevisionItems(revision: WorkRevision): WorkRevision {
  return {
    ...revision,
    status: "collecting",
    items: [],
    updatedAt: new Date().toISOString(),
  };
}

export function withdrawRevisionIntent(
  revision: WorkRevision,
  intentId: string,
): WorkRevision {
  return {
    ...revision,
    items: revision.items.map((item) =>
      item.id === intentId ? { ...item, status: "withdrawn" as const } : item,
    ),
    updatedAt: new Date().toISOString(),
  };
}
