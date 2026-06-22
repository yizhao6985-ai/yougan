import type { RevisionIntent } from "@yougan/domain";
import { openRevisionItems } from "@yougan/domain";

export function groupRevisionItemsByBlock(
  revision: Parameters<typeof openRevisionItems>[0],
) {
  const items = openRevisionItems(revision);
  const byBlock = new Map<string, RevisionIntent[]>();
  const unanchored: RevisionIntent[] = [];

  for (const item of items) {
    const blockId = item.anchor?.blockId?.trim();
    if (blockId) {
      const list = byBlock.get(blockId) ?? [];
      list.push(item);
      byBlock.set(blockId, list);
    } else {
      unanchored.push(item);
    }
  }

  return { items, byBlock, unanchored };
}
