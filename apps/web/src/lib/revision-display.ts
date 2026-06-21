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

const HIGHLIGHT_CLASS = "ring-2 ring-primary/35 ring-offset-2 ring-offset-background";

export function scrollToPreviewBlock(blockId: string) {
  const element = document.querySelector<HTMLElement>(
    `[data-block-id="${blockId}"]`,
  );
  if (!element) return false;

  element.scrollIntoView({ behavior: "smooth", block: "center" });
  element.classList.add(HIGHLIGHT_CLASS, "rounded-md", "transition-shadow");
  window.setTimeout(() => {
    element.classList.remove(HIGHLIGHT_CLASS, "rounded-md", "transition-shadow");
  }, 2000);
  return true;
}
