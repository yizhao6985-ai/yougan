import { Message, MessageContent } from "@/components/ai-elements/message";
import { Button } from "@/components/ui/button";
import {
  ChatStreamBlock,
  chatStreamBlock,
} from "@/components/studio/chat-stream-block";
import { CHAT_COPY } from "@/lib/site-copy";
import type { ReviseConfirmInterruptValue } from "@yougan/domain";
import { cn } from "@/lib/utils";

type ReviseConfirmPromptProps = {
  interrupt: ReviseConfirmInterruptValue;
  disabled?: boolean;
  onConfirm: () => void | Promise<void>;
  onDecline: () => void | Promise<void>;
};

export function ReviseConfirmPrompt({
  interrupt,
  disabled = false,
  onConfirm,
  onDecline,
}: ReviseConfirmPromptProps) {
  return (
    <Message from="assistant" className="max-w-full">
      <MessageContent className="w-full max-w-full p-0">
        <ChatStreamBlock className="border-primary/25 bg-primary/[0.04]">
          <div className={chatStreamBlock.header}>
            <span
              className={cn(chatStreamBlock.headerDot, "bg-primary/70")}
              aria-hidden
            />
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className={chatStreamBlock.headerTitle}>{interrupt.title}</p>
              <p className={cn(chatStreamBlock.caption, "whitespace-pre-wrap")}>
                {interrupt.message}
              </p>
            </div>
          </div>
          <div
            className={cn(
              chatStreamBlock.divider,
              "flex flex-wrap items-center justify-end gap-1.5",
            )}
          >
            <Button
              type="button"
              size="sm"
              className="h-7 px-2.5 text-xs"
              disabled={disabled}
              onClick={() => void onConfirm()}
            >
              {CHAT_COPY.reviseConfirm.confirm}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2.5 text-xs"
              disabled={disabled}
              onClick={() => void onDecline()}
            >
              {CHAT_COPY.reviseConfirm.decline}
            </Button>
          </div>
        </ChatStreamBlock>
      </MessageContent>
    </Message>
  );
}
