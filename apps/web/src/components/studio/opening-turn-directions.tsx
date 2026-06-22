import { useCallback, useState } from "react";

import { chatStreamBlock } from "@/components/studio/chat-stream-block";
import { useOpeningDirectionsReveal } from "@/hooks/use-opening-directions-reveal";
import { resolveTurnDirectionChipText } from "@/lib/direction-display";
import type { TurnDirections } from "@/lib/types";
import { cn } from "@/lib/utils";

type OpeningTurnDirectionsProps = {
  directions: TurnDirections["directions"];
  hint?: string;
  animate?: boolean;
  disabled?: boolean;
  onSelect: (prompt: string) => void | Promise<void>;
  onRevealComplete?: () => void;
  className?: string;
};

/** 开屏延伸方向（无消息时展示；打字机动画 + 展示截断，点击发送完整 prompt） */
export function OpeningTurnDirections({
  directions,
  hint,
  animate = false,
  disabled = false,
  onSelect,
  onRevealComplete,
  className,
}: OpeningTurnDirectionsProps) {
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const reveal = useOpeningDirectionsReveal({
    directions,
    animate,
    onComplete: onRevealComplete,
  });

  const handleSelect = useCallback(
    (prompt: string) => {
      if (disabled || !reveal.isDone || pendingPrompt) return;
      setPendingPrompt(prompt);
      void Promise.resolve(onSelect(prompt)).catch(() => {
        setPendingPrompt(null);
      });
    },
    [disabled, onSelect, pendingPrompt, reveal.isDone],
  );

  if (directions.length < 1) return null;

  const isLocked = disabled || !reveal.isDone || Boolean(pendingPrompt);

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
        {directions.slice(0, reveal.visibleCount).map((item, index) => {
          const isPending = pendingPrompt === item.prompt;
          const isTyping = reveal.showCaret(index);
          const typedText = reveal.getDisplayText(index);
          const displayText =
            isTyping || isPending
              ? typedText
              : resolveTurnDirectionChipText(item);

          return (
            <button
              key={item.id}
              type="button"
              disabled={isLocked && !isPending}
              title={item.prompt}
              onClick={() => handleSelect(item.prompt)}
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
