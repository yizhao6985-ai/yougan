import { Shimmer } from "@/components/ai-elements/shimmer";
import { cn } from "@/lib/utils";
import { CHAT_COPY } from "@/lib/site-copy";

type ChatLoadingDotsProps = {
  className?: string;
};

/** 助手等待回复时的轻量加载指示（无气泡框） */
export function ChatLoadingDots({ className }: ChatLoadingDotsProps) {
  return (
    <p
      className={cn("text-sm leading-6", className)}
      role="status"
      aria-label={CHAT_COPY.replying}
    >
      <Shimmer className="text-muted-foreground">{CHAT_COPY.replying}</Shimmer>
    </p>
  );
}
