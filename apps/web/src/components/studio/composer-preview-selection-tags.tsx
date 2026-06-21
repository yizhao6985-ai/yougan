import { XIcon } from "lucide-react";

import { useComposerPreviewSelectionsContext } from "@/components/studio/composer-preview-selections-context";
import type { ComposerPreviewSelection } from "@/hooks/use-composer-preview-selections";
import { CHAT_COPY } from "@/lib/site-copy";
import { previewSelectionLabel } from "@yougan/domain";
import { cn } from "@/lib/utils";

function ComposerPreviewSelectionTag({
  item,
  onRemove,
}: {
  item: ComposerPreviewSelection;
  onRemove: (id: string) => void;
}) {
  return (
    <span
      className="inline-flex h-5 max-w-[11rem] shrink-0 items-center gap-0.5 rounded-md border border-primary/20 bg-primary/10 px-1.5 text-sm leading-none text-foreground"
      title={item.quote}
    >
      <span className="truncate">
        {CHAT_COPY.previewSelection.tagPrefix}
        {previewSelectionLabel(item.quote, 16)}」
      </span>
      <button
        type="button"
        className="-mr-0.5 inline-flex shrink-0 items-center justify-center rounded-sm text-muted-foreground transition hover:bg-background/80 hover:text-foreground"
        aria-label={CHAT_COPY.previewSelection.removeTag}
        onClick={() => onRemove(item.id)}
      >
        <XIcon className="size-2.5" aria-hidden />
      </button>
    </span>
  );
}

export function ComposerPreviewSelectionTags({
  className,
  inline = false,
}: {
  className?: string;
  /** 与文本输入并排展示在输入区内 */
  inline?: boolean;
}) {
  const { items, remove } = useComposerPreviewSelectionsContext();

  if (items.length === 0) return null;

  const tags = items.map((item) => (
    <ComposerPreviewSelectionTag key={item.id} item={item} onRemove={remove} />
  ));

  if (inline) {
    return <>{tags}</>;
  }

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>{tags}</div>
  );
}
