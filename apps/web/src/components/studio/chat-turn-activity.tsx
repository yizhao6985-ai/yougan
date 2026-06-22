import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  ChatStreamBlock,
  chatStreamBlock,
} from "@/components/studio/chat-stream-block";
import type { TurnActivityStatus } from "@yougan/domain";
import { cn } from "@/lib/utils";

type ChatTurnActivityProps = {
  label: string;
  detail?: string | null;
  status?: TurnActivityStatus;
  className?: string;
};

const statusDotStyles: Record<TurnActivityStatus, string> = {
  running: "bg-primary animate-pulse",
  done: "bg-primary/70",
  failed: "bg-destructive",
};

/** 对话流内业务 Activity（方向更新、制作步骤、参考分析等） */
export function ChatTurnActivity({
  label,
  detail,
  status = "done",
  className,
}: ChatTurnActivityProps) {
  const trimmedDetail = detail?.trim();
  const isRunning = status === "running";
  const isFailed = status === "failed";

  return (
    <ChatStreamBlock tone="muted" className={className}>
      <div className={chatStreamBlock.header}>
        <span
          aria-hidden
          className={cn(chatStreamBlock.headerDot, statusDotStyles[status])}
        />
        <div className="min-w-0 flex-1 space-y-1">
          <p
            className={cn(
              chatStreamBlock.headerTitle,
              isFailed && "text-destructive",
            )}
            role="status"
          >
            {isRunning ? (
              <Shimmer className="text-foreground">{label}</Shimmer>
            ) : (
              label
            )}
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
