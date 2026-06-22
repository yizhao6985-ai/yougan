import { useCallback, useMemo, useState } from "react";

import { chatStreamBlock } from "@/components/studio/chat-stream-block";
import { DEFAULT_TURN_DIRECTIONS_HINT } from "@yougan/domain";
import {
  type TurnDirection,
  type TurnDirections,
  type WorkProfile,
} from "@/lib/types";
import { groupProfileSetupDirections } from "@/lib/profile-setup-direction-display";
import { resolveTurnDirectionChipText } from "@/lib/direction-display";
import { cn } from "@/lib/utils";

type TurnDirectionOptionsProps = {
  directions: TurnDirections["directions"];
  hint?: string;
  profile?: WorkProfile;
  loading?: boolean;
  disabled?: boolean;
  onSelect: (prompt: string) => void | Promise<void>;
  className?: string;
};

function DirectionButton({
  item,
  index,
  isLocked,
  pendingPrompt,
  onSelect,
}: {
  item: TurnDirection;
  index: number;
  isLocked: boolean;
  pendingPrompt: string | null;
  onSelect: (prompt: string) => void;
}) {
  const isPending = pendingPrompt === item.prompt;
  const displayText = isPending
    ? item.prompt
    : resolveTurnDirectionChipText(item);

  return (
    <button
      key={item.id}
      type="button"
      disabled={isLocked && !isPending}
      title={item.prompt}
      onClick={() => onSelect(item.prompt)}
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

/** 对话流内延伸方向：展示 label，点击发送完整 prompt */
export function TurnDirectionOptions({
  directions,
  hint = DEFAULT_TURN_DIRECTIONS_HINT,
  profile,
  loading = false,
  disabled = false,
  onSelect,
  className,
}: TurnDirectionOptionsProps) {
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  const handleSelect = useCallback(
    (prompt: string) => {
      if (disabled || loading || pendingPrompt) return;
      setPendingPrompt(prompt);
      void Promise.resolve(onSelect(prompt)).catch(() => {
        setPendingPrompt(null);
      });
    },
    [disabled, loading, onSelect, pendingPrompt],
  );

  const groups = useMemo(
    () => groupProfileSetupDirections(directions, profile),
    [profile, directions],
  );

  if (directions.length < 1) return null;

  const isLocked = disabled || loading || Boolean(pendingPrompt);
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
                  {group.directions.map((item) => {
                    const index = buttonIndex;
                    buttonIndex += 1;
                    return (
                      <DirectionButton
                        key={item.id}
                        item={item}
                        index={index}
                        isLocked={isLocked}
                        pendingPrompt={pendingPrompt}
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
                  {group.directions.map((item) => {
                    const index = buttonIndex;
                    buttonIndex += 1;
                    return (
                      <DirectionButton
                        key={item.id}
                        item={item}
                        index={index}
                        isLocked={isLocked}
                        pendingPrompt={pendingPrompt}
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
          {directions.map((item, index) => (
            <DirectionButton
              key={item.id}
              item={item}
              index={index}
              isLocked={isLocked}
              pendingPrompt={pendingPrompt}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
