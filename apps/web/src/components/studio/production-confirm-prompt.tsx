import { Message, MessageContent } from "@/components/ai-elements/message";
import { Button } from "@/components/ui/button";
import {
  ChatStreamBlock,
  chatStreamBlock,
} from "@/components/studio/chat-stream-block";
import { CHAT_COPY } from "@/lib/site-copy";
import type { ProductionConfirmInterruptValue } from "@yougan/domain";
import { cn } from "@/lib/utils";

type ProductionConfirmPromptProps = {
  interrupt: ProductionConfirmInterruptValue;
  disabled?: boolean;
  onConfirm: () => void | Promise<void>;
  onDecline: () => void | Promise<void>;
};

/** 进入 production 前的确认：对话流内独立助手气泡 */
export function ProductionConfirmPrompt({
  interrupt,
  disabled = false,
  onConfirm,
  onDecline,
}: ProductionConfirmPromptProps) {
  return (
    <Message from="assistant" className="max-w-full">
      <MessageContent className="w-full max-w-full p-0">
        <ChatStreamBlock className="border-primary/25 bg-primary/[0.04]">
          <div className={chatStreamBlock.header}>
            <span
              className={cn(chatStreamBlock.headerDot, "bg-primary/70")}
              aria-hidden
            />
            <div className="min-w-0 flex-1 space-y-2">
              <p className={chatStreamBlock.headerTitle}>{interrupt.title}</p>
              <p className={cn(chatStreamBlock.body, "whitespace-pre-wrap")}>
                {interrupt.message}
              </p>
              <p className={chatStreamBlock.caption}>
                {CHAT_COPY.productionConfirm.durationHint}
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
              {CHAT_COPY.productionConfirm.confirm}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2.5 text-xs"
              disabled={disabled}
              onClick={() => void onDecline()}
            >
              {CHAT_COPY.productionConfirm.decline}
            </Button>
          </div>
        </ChatStreamBlock>
      </MessageContent>
    </Message>
  );
}
