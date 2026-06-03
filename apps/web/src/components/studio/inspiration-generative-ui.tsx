import { useCallback, useState } from "react";

import { chatStreamBlock } from "@/components/studio/chat-stream-block";
import { DEFAULT_BRIEF_UI_HINT, type BriefSuggestions } from "@/lib/brief-ui-spec";
import { cn } from "@/lib/utils";

type BriefSuggestionOptionsProps = {
  suggestions: BriefSuggestions["suggestions"];
  hint?: string;
  loading?: boolean;
  disabled?: boolean;
  onSelect: (message: string) => void | Promise<void>;
  className?: string;
};

/** 对话流内下一步建议：每条展示为可点击的用户口吻文案（点击即发送 message） */
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
    <div className={cn("mt-3 w-full", className)}>
      {hint ? (
        <p className={cn(chatStreamBlock.caption, "mb-2 px-0.5")}>{hint}</p>
      ) : null}

      <div className="flex flex-col gap-2">
        {suggestions.map((item) => {
          const isPending = pendingMessage === item.message;
          return (
            <button
              key={item.id}
              type="button"
              disabled={isLocked && !isPending}
              onClick={() => handleSelect(item.message)}
              className={cn(
                "w-full rounded-lg px-3 py-2.5 text-left transition",
                "whitespace-pre-wrap break-words bg-card text-sm leading-relaxed text-foreground",
                "ring-1 ring-border/80",
                "hover:ring-primary/30 hover:bg-accent/30",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-45",
                isPending && "bg-primary/[0.07] ring-primary/35",
              )}
            >
              {item.message}
            </button>
          );
        })}
      </div>
    </div>
  );
}
