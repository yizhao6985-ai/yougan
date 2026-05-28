import { MessageResponse } from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { CHAT_COPY } from "@/lib/site-copy";
import { cn } from "@/lib/utils";

type AIResponseProps = {
  content: string;
  reasoning?: string;
  isStreaming?: boolean;
};

export function AIResponse({
  content,
  reasoning,
  isStreaming = false,
}: AIResponseProps) {
  const hasContent = Boolean(content.trim());
  const hasReasoning = Boolean(reasoning?.trim());

  if (!hasContent && !hasReasoning && !isStreaming) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card px-4 py-3 shadow-sm",
        "text-sm leading-7 text-foreground/90",
        "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
      )}
    >
      {hasReasoning ? (
        <Reasoning className="mb-3" isStreaming={isStreaming && !hasContent}>
          <ReasoningTrigger />
          <ReasoningContent>{reasoning}</ReasoningContent>
        </Reasoning>
      ) : null}

      {hasContent ? (
        <MessageResponse isAnimating={isStreaming}>{content}</MessageResponse>
      ) : isStreaming ? (
        <Shimmer className="text-muted-foreground">{CHAT_COPY.thinking}</Shimmer>
      ) : null}
    </div>
  );
}
