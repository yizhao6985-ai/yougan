import { openRevisionItems, type RevisionIntent, type WorkRevision } from "@yougan/domain";

import type { TurnBriefingFallback } from "./build-briefing-fallback.js";

const INSTRUCTION_PREVIEW_MAX = 52;
const QUOTE_PREVIEW_MAX = 36;
const DETAIL_INSTRUCTION_MAX = 100;

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}

export function revisionTurnHadChanges(
  before: WorkRevision | undefined,
  after: WorkRevision,
): boolean {
  return JSON.stringify(before) !== JSON.stringify(after);
}

/** 本轮新写入清单的改稿项（优先）；否则取当前 open 项 */
export function revisionItemsForImpact(
  before: WorkRevision | undefined,
  after: WorkRevision,
): RevisionIntent[] {
  const beforeItems = openRevisionItems(before);
  const afterItems = openRevisionItems(after);
  const beforeIds = new Set(beforeItems.map((item) => item.id));
  const added = afterItems.filter((item) => !beforeIds.has(item.id));
  if (added.length > 0) return added;
  if (revisionTurnHadChanges(before, after)) return afterItems;
  return [];
}

function buildScopeImpactLabel(items: RevisionIntent[]): string {
  const anchored = items.filter((item) => item.anchor?.quote?.trim());
  const global = items.length - anchored.length;

  if (items.length === 1) {
    const item = items[0]!;
    const instruction = truncate(item.instruction.trim(), INSTRUCTION_PREVIEW_MAX);
    if (item.anchor?.quote?.trim()) {
      return `已记录一处局部改稿（「${truncate(item.anchor.quote.trim(), QUOTE_PREVIEW_MAX)}」），后续改稿会按此调整对应段落`;
    }
    return `已记录一处整体改稿（${instruction}），后续执行改稿时正文会按此方向调整`;
  }

  if (anchored.length > 0 && global === 0) {
    return `已记录 ${items.length} 处局部改稿，后续改稿会逐段按清单调整`;
  }
  if (global > 0 && anchored.length === 0) {
    return `已记录 ${items.length} 条整体改稿方向，后续执行改稿时结构与表达会整体调整`;
  }
  return `已记录 ${items.length} 条改稿（含局部与整体），后续改稿会按清单逐项落地`;
}

function buildItemsExcerpt(items: RevisionIntent[]): string | null {
  if (items.length === 0) return null;

  const detailLines = items.slice(0, 6).map((item, index) => {
    const instruction = item.instruction.trim();
    const quote = item.anchor?.quote?.trim();
    if (quote) {
      return `${index + 1}. 「${truncate(quote, QUOTE_PREVIEW_MAX)}」→ ${truncate(instruction, DETAIL_INSTRUCTION_MAX)}`;
    }
    return `${index + 1}. ${truncate(instruction, DETAIL_INSTRUCTION_MAX)}`;
  });

  let excerpt = detailLines.join("\n");
  if (items.length > 6) {
    excerpt += `\n…等 ${items.length} 处`;
  }
  return excerpt;
}

/** 收集改稿：说明开始改稿后成稿会如何变化 */
export function buildCollectRevisionImpact(input: {
  before: WorkRevision | undefined;
  after: WorkRevision;
}): TurnBriefingFallback | null {
  if (!revisionTurnHadChanges(input.before, input.after)) {
    return null;
  }

  const items = revisionItemsForImpact(input.before, input.after);
  if (items.length === 0) {
    return {
      effectSummary: "本轮还没形成会改变成稿的具体方向，现有正文不会动",
      excerpt: null,
    };
  }

  return {
    effectSummary: buildScopeImpactLabel(items),
    excerpt: buildItemsExcerpt(items),
  };
}
