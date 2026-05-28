import { useCallback, useState } from "react";

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
    <div className={cn("mt-3 space-y-1.5", className)}>
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
              "flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition",
              isPending
                ? "border-primary/40 bg-primary/10"
                : "border-border/70 bg-background hover:border-primary/25 hover:bg-accent/50",
              "disabled:cursor-not-allowed disabled:opacity-55",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold",
                isPending
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {letter}
            </span>
            <span className="text-sm leading-6 text-foreground">
              {option.description}
            </span>
          </button>
        );
      })}
      <p className="pt-1 text-xs leading-5 text-muted-foreground">{hint}</p>
    </div>
  );
}
