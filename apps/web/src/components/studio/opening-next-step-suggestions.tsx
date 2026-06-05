import { useCallback, useState } from "react";

import { chatStreamBlock } from "@/components/studio/chat-stream-block";
import { useOpeningSuggestionsReveal } from "@/hooks/use-opening-suggestions-reveal";
import { truncateSuggestionForDisplay } from "@/lib/suggestion-display";
import type { NextStepSuggestions } from "@/lib/types";
import { cn } from "@/lib/utils";

type OpeningNextStepSuggestionsProps = {
  suggestions: NextStepSuggestions["suggestions"];
  hint?: string;
  animate?: boolean;
  disabled?: boolean;
  onSelect: (message: string) => void | Promise<void>;
  onRevealComplete?: () => void;
  className?: string;
};

/** 开屏选题建议（无消息时展示；打字机动画 + 展示截断，点击发送完整 message） */
export function OpeningNextStepSuggestions({
  suggestions,
  hint,
  animate = false,
  disabled = false,
  onSelect,
  onRevealComplete,
  className,
}: OpeningNextStepSuggestionsProps) {
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
      className={cn("w-full max-w-5xl", className)}
      aria-busy={!reveal.isDone}
      aria-live="polite"
    >
      {hint ? (
        <p className={cn(chatStreamBlock.caption, "mb-1.5 text-center")}>{hint}</p>
      ) : null}

      <div className="flex flex-wrap items-center justify-center gap-2">
        {suggestions.slice(0, reveal.visibleCount).map((item, index) => {
          const isPending = pendingMessage === item.message;
          const isTyping = reveal.showCaret(index);
          const typedText = reveal.getDisplayText(index);
          const displayText =
            isTyping || isPending
              ? typedText
              : truncateSuggestionForDisplay(item.message);

          return (
            <button
              key={item.id}
              type="button"
              disabled={isLocked && !isPending}
              title={item.message}
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
                  isPending && "text-base text-foreground",
                )}
              >
                {displayText}
                {isTyping ? (
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
