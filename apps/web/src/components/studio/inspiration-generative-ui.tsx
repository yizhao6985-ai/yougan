import { ChevronRightIcon } from "lucide-react";
import { useCallback, useState } from "react";

import { chatStreamBlock } from "@/components/studio/chat-stream-block";
import {
  DEFAULT_BRIEF_UI_HINT,
  optionLetter,
  type BriefSuggestions,
} from "@/lib/brief-ui-spec";
import { cn } from "@/lib/utils";

export type BriefSuggestionVariant = "opening" | "conversation";

type BriefSuggestionOptionsProps = {
  suggestions: BriefSuggestions["suggestions"];
  hint?: string;
  variant?: BriefSuggestionVariant;
  loading?: boolean;
  disabled?: boolean;
  onSelect: (message: string) => void | Promise<void>;
  className?: string;
};

export function BriefSuggestionOptions({
  suggestions,
  hint = DEFAULT_BRIEF_UI_HINT,
  variant = "conversation",
  loading = false,
  disabled = false,
  onSelect,
  className,
}: BriefSuggestionOptionsProps) {
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  const handleSelect = useCallback(
    (message: string) => {
      if (disabled || loading || pendingMessage) return;
      setPendingMessage(message);
      void Promise.resolve(onSelect(message)).catch(() => {
        setPendingMessage(null);
      });
    },
    [disabled, loading, onSelect, pendingMessage],
  );

  if (suggestions.length < 1) return null;

  const isLocked = disabled || loading || Boolean(pendingMessage);
  const isOpening = variant === "opening";

  return (
    <div className={cn(isOpening ? "w-full" : "mt-3 w-full", className)}>
      {hint ? (
        <p
          className={cn(
            chatStreamBlock.caption,
            isOpening ? "mb-2 text-center" : "mb-1.5 px-0.5",
          )}
        >
          {hint}
        </p>
      ) : null}

      {isOpening ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {suggestions.map((item) => {
            const isPending = pendingMessage === item.message;
            return (
              <button
                key={item.id}
                type="button"
                disabled={isLocked && !isPending}
                onClick={() => handleSelect(item.message)}
                className={cn(
                  chatStreamBlock.inset,
                  chatStreamBlock.insetInteractive,
                  chatStreamBlock.suggestionItem,
                  "inline-flex max-w-full rounded-2xl px-4 py-2.5 text-left",
                  "whitespace-normal shadow-sm shadow-black/[0.02]",
                  isPending &&
                    cn(
                      chatStreamBlock.suggestionItemActive,
                      "border-primary/40 bg-primary/10",
                    ),
                )}
              >
                {item.message}
              </button>
            );
          })}
        </div>
      ) : (
        <div
          className={cn(
            "overflow-hidden rounded-lg border border-border/70 bg-card",
            "shadow-sm shadow-black/[0.03] ring-1 ring-border/35",
            "dark:shadow-black/20",
          )}
        >
          {suggestions.map((item, index) => {
            const isPending = pendingMessage === item.message;
            const isLast = index === suggestions.length - 1;
            return (
              <button
                key={item.id}
                type="button"
                disabled={isLocked && !isPending}
                onClick={() => handleSelect(item.message)}
                className={cn(
                  "group flex w-full items-center gap-2.5 px-3 py-2 text-left transition-[background-color,box-shadow,color]",
                  "hover:bg-accent/40 active:bg-accent/55",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  "disabled:cursor-not-allowed disabled:opacity-45",
                  !isLast && "border-b border-border/55",
                  isPending && "bg-primary/[0.07] hover:bg-primary/10",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-md",
                    "border border-primary/20 bg-primary/[0.07] text-[10px] font-semibold leading-none text-primary/75",
                    "transition-colors group-hover:border-primary/35 group-hover:bg-primary/12 group-hover:text-primary",
                    isPending && "border-primary/40 bg-primary/15 text-primary",
                  )}
                >
                  {optionLetter(index)}
                </span>
                <span
                  className={cn(
                    chatStreamBlock.suggestionItem,
                    "min-w-0 flex-1 transition-colors",
                    "group-hover:text-foreground/75",
                    isPending && chatStreamBlock.suggestionItemActive,
                  )}
                >
                  {item.message}
                </span>
                <ChevronRightIcon
                  aria-hidden
                  className={cn(
                    "size-3.5 shrink-0 text-muted-foreground/30 transition-all",
                    "group-hover:translate-x-0.5 group-hover:text-primary/55",
                    "group-disabled:translate-x-0 group-disabled:opacity-0",
                    isPending && "text-primary/50",
                  )}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
