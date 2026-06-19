import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  ChatStreamBlock,
  chatStreamBlock,
} from "@/components/studio/chat-stream-block";
import { cn } from "@/lib/utils";

type ChatRunProgressProps = {
  label: string;
  detail?: string | null;
  className?: string;
};

/** 对话流内展示当前运行步骤（制作、参考分析等） */
export function ChatRunProgress({
  label,
  detail,
  className,
}: ChatRunProgressProps) {
  const trimmedDetail = detail?.trim();

  return (
    <ChatStreamBlock className={className}>
      <div className={chatStreamBlock.header}>
        <span
          aria-hidden
          className={cn(
            chatStreamBlock.headerDot,
            "bg-primary animate-pulse",
          )}
        />
        <div className="min-w-0 flex-1 space-y-1">
          <p className={chatStreamBlock.headerTitle} role="status">
            <Shimmer className="text-foreground">{label}</Shimmer>
          </p>
          {trimmedDetail ? (
            <p className={cn(chatStreamBlock.caption, "whitespace-pre-wrap")}>
              {trimmedDetail}
            </p>
          ) : null}
        </div>
      </div>
    </ChatStreamBlock>
  );
}
