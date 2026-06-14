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
        "group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
      aria-label={launcherPlaceholder}
      aria-haspopup="dialog"
      onClick={onOpen}
    >
      <MessageSquareTextIcon
        className="size-4 shrink-0 text-primary"
        aria-hidden
      />
      <span className="hidden whitespace-nowrap text-primary md:inline">
        {launcherLabel}
      </span>
    </button>
  );
}

/** @deprecated 使用 HelpChatLauncher */
export function HelpChatLauncherCompact(props: HelpChatLauncherProps) {
  return <HelpChatLauncher {...props} />;
}
