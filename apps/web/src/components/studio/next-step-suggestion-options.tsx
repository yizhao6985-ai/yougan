import { useCallback, useMemo, useState } from "react";

import { chatStreamBlock } from "@/components/studio/chat-stream-block";
import { DEFAULT_NEXT_STEP_SUGGESTIONS_HINT } from "@yougan/domain";
import {
  type NextStepSuggestions,
  type WorkProfile,
} from "@/lib/types";
import { groupProfileSetupSuggestions } from "@/lib/profile-setup-suggestion-display";
import { truncateSuggestionForDisplay } from "@/lib/suggestion-display";
import { cn } from "@/lib/utils";

type NextStepSuggestionOptionsProps = {
  suggestions: NextStepSuggestions["suggestions"];
  hint?: string;
  profile?: WorkProfile;
  loading?: boolean;
  disabled?: boolean;
  onSelect: (message: string) => void | Promise<void>;
  className?: string;
};

function SuggestionButton({
  item,
  index,
  isLocked,
  pendingMessage,
  onSelect,
}: {
  item: NextStepSuggestions["suggestions"][number];
  index: number;
  isLocked: boolean;
  pendingMessage: string | null;
  onSelect: (message: string) => void;
}) {
  const isPending = pendingMessage === item.message;
  const displayText = isPending
    ? item.message
    : truncateSuggestionForDisplay(item.message);

  return (
    <button
      key={item.id}
      type="button"
      disabled={isLocked && !isPending}
      title={item.message}
      onClick={() => onSelect(item.message)}
      className={cn(
        "w-full rounded-lg px-3 py-2.5 text-left transition",
        "animate-in fade-in slide-in-from-bottom-1 duration-300",
        "bg-card text-sm leading-relaxed text-foreground",
        "ring-1 ring-border/80",
        "hover:ring-primary/30 hover:bg-accent/30",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-45",
        isPending && "whitespace-pre-wrap break-words bg-primary/[0.07] ring-primary/35",
        !isPending && "line-clamp-2",
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {displayText}
    </button>
  );
}

/** 对话流内下一步建议：展示截断文案，点击发送完整 message */
export function NextStepSuggestionOptions({
  suggestions,
  hint = DEFAULT_NEXT_STEP_SUGGESTIONS_HINT,
  profile,
  loading = false,
  disabled = false,
  onSelect,
  className,
}: NextStepSuggestionOptionsProps) {
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

  const groups = useMemo(
    () => groupProfileSetupSuggestions(suggestions, profile),
    [profile, suggestions],
  );

  if (suggestions.length < 1) return null;

  const isLocked = disabled || loading || Boolean(pendingMessage);
  const hasGroupedSteps = groups.some(
    (group) =>
      group.step !== "_ungrouped" &&
      (group.step === "_consolidate" ||
        group.step === "_advance" ||
        group.title.length > 0),
  );

  let buttonIndex = 0;

  return (
    <div className={cn("mt-3 w-full", className)}>
      {hint ? (
        <p className={cn(chatStreamBlock.caption, "mb-2 px-0.5")}>{hint}</p>
      ) : null}

      {hasGroupedSteps ? (
        <div className="flex flex-col gap-3">
          {groups.map((group) => {
            if (group.step === "_ungrouped") {
              return (
                <div key="ungrouped" className="flex flex-col gap-2">
                  {group.suggestions.map((item) => {
                    const index = buttonIndex;
                    buttonIndex += 1;
                    return (
                      <SuggestionButton
                        key={item.id}
                        item={item}
                        index={index}
                        isLocked={isLocked}
                        pendingMessage={pendingMessage}
                        onSelect={handleSelect}
                      />
                    );
                  })}
                </div>
              );
            }

            return (
              <div key={group.step} className="flex flex-col gap-1.5">
                <p className={cn(chatStreamBlock.caption, "px-0.5")}>
                  {group.title}
                </p>
                <div className="flex flex-col gap-2">
                  {group.suggestions.map((item) => {
                    const index = buttonIndex;
                    buttonIndex += 1;
                    return (
                      <SuggestionButton
                        key={item.id}
                        item={item}
                        index={index}
                        isLocked={isLocked}
                        pendingMessage={pendingMessage}
                        onSelect={handleSelect}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {suggestions.map((item, index) => (
            <SuggestionButton
              key={item.id}
              item={item}
              index={index}
              isLocked={isLocked}
              pendingMessage={pendingMessage}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
