import { useCallback, useState } from "react";

import {
  ChatStreamBlock,
  chatStreamBlock,
} from "@/components/studio/chat-stream-block";
import {
  DEFAULT_BRIEF_UI_HINT,
  suggestionKindLabel,
  type BriefSuggestions,
} from "@/lib/brief-ui-spec";
import { cn } from "@/lib/utils";

type BriefSuggestionOptionsProps = {
  suggestions: BriefSuggestions["suggestions"];
  hint?: string;
  loading?: boolean;
  disabled?: boolean;
  onSelect: (message: string) => void | Promise<void>;
  className?: string;
};

export function BriefSuggestionOptions({
  suggestions,
  hint = DEFAULT_BRIEF_UI_HINT,
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

  return (
    <ChatStreamBlock className={cn("mt-3", className)}>
      <div className="flex flex-wrap gap-2">
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
                "inline-flex max-w-full flex-col items-start gap-0.5 px-3 py-2 text-left",
                isPending && "border-primary/40 bg-primary/10",
              )}
            >
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {suggestionKindLabel(item.kind)}
              </span>
              <span className={cn(chatStreamBlock.body, "text-sm font-medium")}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      <p className={chatStreamBlock.caption}>{hint}</p>
    </ChatStreamBlock>
  );
}
