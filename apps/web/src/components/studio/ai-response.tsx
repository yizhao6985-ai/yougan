import { MessageResponse } from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  ChatStreamBlock,
  chatStreamBlock,
} from "@/components/studio/chat-stream-block";
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
    <ChatStreamBlock>
      {hasReasoning ? (
        <Reasoning
          className={cn("not-prose", hasContent && chatStreamBlock.divider)}
          isStreaming={isStreaming && !hasContent}
        >
          <ReasoningTrigger
            className={cn(
              chatStreamBlock.header,
              "w-full text-muted-foreground hover:text-foreground",
            )}
            getThinkingMessage={(streaming, duration) => {
              if (streaming || duration === 0) {
                return (
                  <Shimmer className={chatStreamBlock.muted} duration={1}>
                    {CHAT_COPY.reasoning.streaming}
                  </Shimmer>
                );
              }
              if (duration === undefined) {
                return (
                  <span className={chatStreamBlock.muted}>
                    {CHAT_COPY.reasoning.doneBrief}
                  </span>
                );
              }
              return (
                <span className={chatStreamBlock.muted}>
                  {CHAT_COPY.reasoning.doneSeconds(duration)}
                </span>
              );
            }}
          />
          <ReasoningContent
            className={cn("mt-2", chatStreamBlock.muted, "data-[state=open]:mt-2")}
          >
            {reasoning ?? ""}
          </ReasoningContent>
        </Reasoning>
      ) : null}

      {hasContent ? (
        <MessageResponse
          className={chatStreamBlock.body}
          isAnimating={isStreaming}
        >
          {content}
        </MessageResponse>
      ) : isStreaming ? (
        <Shimmer className={chatStreamBlock.muted}>{CHAT_COPY.thinking}</Shimmer>
      ) : null}
    </ChatStreamBlock>
  );
}
