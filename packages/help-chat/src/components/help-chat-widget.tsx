import { useState } from "react";

import type { HelpChatConfig } from "../types";
import { HelpChatProvider } from "../context/help-chat-config";
import { HelpChatLauncher } from "./help-chat-launcher";
import { HelpChatPanel } from "./help-chat-panel";

export type HelpChatWidgetProps = Partial<HelpChatConfig> & {
  className?: string;
};

export function HelpChatWidget({ className, ...config }: HelpChatWidgetProps) {
  const [open, setOpen] = useState(false);

  return (
    <HelpChatProvider {...config}>
      <HelpChatLauncher onOpen={() => setOpen(true)} className={className} />
      <HelpChatPanel open={open} onOpenChange={setOpen} />
    </HelpChatProvider>
  );
}
