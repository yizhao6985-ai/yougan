import { useCallback, useState } from "react";

import {
  ChatStreamBlock,
  chatStreamBlock,
} from "@/components/studio/chat-stream-block";
import {
  DEFAULT_INSPIRATION_UI_HINT,
  suggestionKindLabel,
  type InspirationSuggestions,
} from "@/lib/inspiration-ui-spec";
import { cn } from "@/lib/utils";

type InspirationSuggestionOptionsProps = {
  suggestions: InspirationSuggestions["suggestions"];
  hint?: string;
  loading?: boolean;
  disabled?: boolean;
  onSelect: (message: string) => void | Promise<void>;
  className?: string;
};

/** 灵感模式建议：点击即发送 message */
export function InspirationSuggestionOptions({
  suggestions,
  hint = DEFAULT_INSPIRATION_UI_HINT,
  loading = false,
  disabled = false,
  onSelect,
  className,
}: InspirationSuggestionOptionsProps) {
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

/** @deprecated 使用 InspirationSuggestionOptions */
export function InspirationChoiceOptions({
  options,
  hint,
  loading,
  disabled,
  onSelect,
  className,
}: {
  options: Array<{ description: string; letter?: string }>;
  hint?: string;
  loading?: boolean;
  disabled?: boolean;
  onSelect: (description: string) => void | Promise<void>;
  className?: string;
}) {
  return (
    <InspirationSuggestionOptions
      suggestions={options.map((o, i) => ({
        id: `${i}-${o.description}`,
        kind: "explore" as const,
        label: o.letter ?? o.description.slice(0, 8),
        message: o.description,
      }))}
      hint={hint}
      loading={loading}
      disabled={disabled}
      onSelect={onSelect}
      className={className}
    />
  );
}
