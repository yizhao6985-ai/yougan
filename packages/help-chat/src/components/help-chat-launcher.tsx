import { MessageSquareTextIcon } from "lucide-react";

import { useHelpChatConfig } from "../context/help-chat-config";
import { cn } from "../lib/cn";

type HelpChatLauncherProps = {
  onOpen: () => void;
  className?: string;
};

export function HelpChatLauncher({ onOpen, className }: HelpChatLauncherProps) {
  const { launcherLabel, launcherPlaceholder } = useHelpChatConfig();

  return (
    <button
      type="button"
      className={cn(
        "group inline-flex cursor-pointer items-center gap-2 rounded-lg transition-colors duration-200",
        "hover:bg-accent/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
      aria-label={launcherPlaceholder}
      aria-haspopup="dialog"
      onClick={onOpen}
    >
      <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary/15">
        <MessageSquareTextIcon className="size-4 shrink-0" aria-hidden />
      </span>
      <span className="hidden whitespace-nowrap text-sm font-medium text-foreground/90 md:inline">
        {launcherLabel}
      </span>
    </button>
  );
}

/** @deprecated 使用 HelpChatLauncher */
export function HelpChatLauncherCompact(props: HelpChatLauncherProps) {
  return <HelpChatLauncher {...props} />;
}
