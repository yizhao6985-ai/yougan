import { useCallback, useState } from "react";

import { chatStreamBlock } from "@/components/studio/chat-stream-block";
import { useOpeningSuggestionsReveal } from "@/hooks/use-opening-suggestions-reveal";
import { CHAT_COPY } from "@/lib/site-copy";
import type { BriefSuggestions } from "@/lib/types";
import { cn } from "@/lib/utils";

type OpeningBriefSuggestionsProps = {
  suggestions: BriefSuggestions["suggestions"];
  hint?: string;
  animate?: boolean;
  disabled?: boolean;
  onSelect: (message: string) => void | Promise<void>;
  onRevealComplete?: () => void;
  className?: string;
};

export function OpeningBriefSuggestions({
  suggestions,
  hint = CHAT_COPY.openingSuggestionsHint,
  animate = false,
  disabled = false,
  onSelect,
  onRevealComplete,
  className,
}: OpeningBriefSuggestionsProps) {
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const reveal = useOpeningSuggestionsReveal({
    suggestions,
    animate,
    onComplete: onRevealComplete,
  });

  const handleSelect = useCallback(
    (message: string) => {
      if (disabled || !reveal.isDone || pendingMessage) return;
      setPendingMessage(message);
      void Promise.resolve(onSelect(message)).catch(() => {
        setPendingMessage(null);
      });
    },
    [disabled, onSelect, pendingMessage, reveal.isDone],
  );

  if (suggestions.length < 1) return null;

  const isLocked = disabled || !reveal.isDone || Boolean(pendingMessage);

  return (
    <div
      className={cn("w-full", className)}
      aria-busy={!reveal.isDone}
      aria-live="polite"
    >
      {hint ? (
        <p className={cn(chatStreamBlock.caption, "mb-1.5 text-center")}>{hint}</p>
      ) : null}

      <div className="flex flex-wrap items-center justify-center gap-2">
        {suggestions.slice(0, reveal.visibleCount).map((item, index) => {
          const isPending = pendingMessage === item.message;
          const displayText = reveal.getDisplayText(index);
          const showCaret = reveal.showCaret(index);

          return (
            <button
              key={item.id}
              type="button"
              disabled={isLocked && !isPending}
              onClick={() => handleSelect(item.message)}
              className={cn(
                chatStreamBlock.openingChip,
                chatStreamBlock.openingChipInteractive,
                "animate-in fade-in duration-200",
                isPending && chatStreamBlock.openingChipPending,
              )}
            >
              <span
                className={cn(
                  chatStreamBlock.openingSuggestionText,
                  "inline text-left",
                  isPending && "text-sm text-foreground",
                )}
              >
                {displayText}
                {showCaret ? (
                  <span
                    aria-hidden
                    className="ml-px inline-block w-[2px] animate-pulse bg-primary/70 align-[-0.1em]"
                  >
                    &nbsp;
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
