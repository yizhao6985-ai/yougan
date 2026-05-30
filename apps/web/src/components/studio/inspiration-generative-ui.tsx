import { useCallback, useState } from "react";

import {
  ChatStreamBlock,
  chatStreamBlock,
} from "@/components/studio/chat-stream-block";
import {
  DEFAULT_INSPIRATION_UI_HINT,
  type InspirationChoice,
  optionLetter,
} from "@/lib/inspiration-ui-spec";
import { cn } from "@/lib/utils";

type InspirationChoiceOptionsProps = {
  options: InspirationChoice[];
  hint?: string;
  loading?: boolean;
  disabled?: boolean;
  onSelect: (description: string) => void | Promise<void>;
  className?: string;
};

/** 灵感模式单选：A/B/C/D + 描述，垂直排列，点击即发送描述 */
export function InspirationChoiceOptions({
  options,
  hint = DEFAULT_INSPIRATION_UI_HINT,
  loading = false,
  disabled = false,
  onSelect,
  className,
}: InspirationChoiceOptionsProps) {
  const [pendingDescription, setPendingDescription] = useState<string | null>(
    null,
  );

  const handleSelect = useCallback(
    (option: InspirationChoice) => {
      if (disabled || loading || pendingDescription) return;
      setPendingDescription(option.description);
      void Promise.resolve(onSelect(option.description)).catch(() => {
        setPendingDescription(null);
      });
    },
    [disabled, loading, onSelect, pendingDescription],
  );

  if (options.length < 2) return null;

  const isLocked = disabled || loading || Boolean(pendingDescription);

  return (
    <ChatStreamBlock className={cn("mt-3", className)}>
      <div className="space-y-2">
        {options.map((option, index) => {
          const letter = option.letter ?? optionLetter(index);
          const isPending = pendingDescription === option.description;

          return (
            <button
              key={`${letter}-${option.description}`}
              type="button"
              disabled={isLocked && !isPending}
              onClick={() => handleSelect(option)}
              className={cn(
                chatStreamBlock.inset,
                chatStreamBlock.insetInteractive,
                "flex w-full items-start gap-3",
                isPending && "border-primary/40 bg-primary/10",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold",
                  isPending
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                {letter}
              </span>
              <span className={chatStreamBlock.body}>{option.description}</span>
            </button>
          );
        })}
      </div>
      <p className={chatStreamBlock.caption}>{hint}</p>
    </ChatStreamBlock>
  );
}
