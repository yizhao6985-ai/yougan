import { MessageResponse } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  ChatStreamBlock,
  chatStreamBlock,
} from "@/components/studio/chat-stream-block";
import { CHAT_COPY } from "@/lib/site-copy";

type AIResponseProps = {
  content: string;
  isStreaming?: boolean;
};

export function AIResponse({
  content,
  isStreaming = false,
}: AIResponseProps) {
  const hasContent = Boolean(content.trim());

  if (!hasContent && !isStreaming) {
    return null;
  }

  return (
    <ChatStreamBlock>
      {hasContent ? (
        <MessageResponse
          className={chatStreamBlock.body}
          isAnimating={isStreaming}
        >
          {content}
        </MessageResponse>
      ) : isStreaming ? (
        <Shimmer className={chatStreamBlock.muted}>{CHAT_COPY.replying}</Shimmer>
      ) : null}
    </ChatStreamBlock>
  );
}
