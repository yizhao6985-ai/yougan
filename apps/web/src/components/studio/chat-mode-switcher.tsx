import { useCallback, useEffect } from "react";

import type { ChatMode } from "@/lib/types";
import {
  CHAT_MODES,
  modeFromShortcut,
  modeLabelWithShortcut,
} from "@/lib/chat-mode-config";
import { CHAT_MODE_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ChatModeSwitcher({
  mode,
  onChange,
  disabled,
}: {
  mode: ChatMode;
  onChange: (mode: ChatMode) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex rounded-lg border border-border bg-muted/80 p-0.5">
      {CHAT_MODES.map((item) => (
        <Tooltip key={item}>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={disabled}
              className={cn(
                "h-7 rounded-md px-2 text-xs",
                mode === item &&
                  "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
              )}
              onClick={() => onChange(item)}
            >
              {CHAT_MODE_LABELS[item]}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {modeLabelWithShortcut(item)}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

export function useChatModeShortcuts(
  active: boolean,
  currentMode: ChatMode,
  onChange: (mode: ChatMode) => void,
) {
  const handleSwitch = useCallback(
    (nextMode: ChatMode) => {
      if (nextMode !== currentMode) onChange(nextMode);
    },
    [currentMode, onChange],
  );

  useEffect(() => {
    if (!active) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const nextMode = modeFromShortcut(event);
      if (!nextMode) return;

      event.preventDefault();
      event.stopPropagation();
      handleSwitch(nextMode);
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [active, handleSwitch]);
}
