/** 改稿意见锚点（block 内选区或引用原文） */
export interface RevisionAnchor {
  blockId: string;
  quote: string;
  startOffset?: number | null;
  endOffset?: number | null;
}

export type RevisionIntentSource = "selection" | "chat" | "manual";

export type RevisionIntentStatus = "open" | "withdrawn";

/** 单条改稿意见 */
export interface RevisionIntent {
  id: string;
  anchor?: RevisionAnchor | null;
  instruction: string;
  source: RevisionIntentSource;
  created_at: string;
  status?: RevisionIntentStatus;
}

export type WorkRevisionStatus = "collecting" | "ready" | "applying";

/** 作品改稿清单（Work 顶层字段 revision） */
export interface WorkRevision {
  baselineVersionId?: string | null;
  status: WorkRevisionStatus;
  items: RevisionIntent[];
  updatedAt?: string | null;
}

export const EMPTY_WORK_REVISION: WorkRevision = {
  status: "collecting",
  items: [],
};
