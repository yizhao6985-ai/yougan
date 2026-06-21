import { useMemoizedFn } from "ahooks";
import { useState } from "react";
import { nanoid } from "nanoid";

import type { HumanPreviewSelection } from "@yougan/domain";

export type ComposerPreviewSelection = HumanPreviewSelection & {
  id: string;
};

export function useComposerPreviewSelections() {
  const [items, setItems] = useState<ComposerPreviewSelection[]>([]);

  const add = useMemoizedFn((input: HumanPreviewSelection) => {
    const blockId = input.blockId.trim();
    const quote = input.quote.trim();
    if (!blockId || !quote) return;

    setItems((prev) => {
      const duplicate = prev.some(
        (item) => item.blockId === blockId && item.quote === quote,
      );
      if (duplicate) return prev;
      return [...prev, { id: nanoid(), blockId, quote }];
    });
  });

  const remove = useMemoizedFn((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  });

  const clear = useMemoizedFn(() => {
    setItems([]);
  });

  const toPayload = useMemoizedFn((): HumanPreviewSelection[] =>
    items.map(({ blockId, quote }) => ({ blockId, quote })),
  );

  return {
    items,
    add,
    remove,
    clear,
    toPayload,
    hasSelections: items.length > 0,
  };
}

export type ComposerPreviewSelectionsStore = ReturnType<
  typeof useComposerPreviewSelections
>;
