import { MessageResponse } from "@/components/ai-elements/message";
import {
  ChatStreamBlock,
  chatStreamBlock,
} from "@/components/studio/chat-stream-block";

type AIResponseProps = {
  content: string;
  isStreaming?: boolean;
};

export function AIResponse({
  content,
  isStreaming = false,
}: AIResponseProps) {
  const hasContent = Boolean(content.trim());

  if (!hasContent) {
    return null;
  }

  return (
    <ChatStreamBlock>
      <MessageResponse
        className={chatStreamBlock.body}
        isAnimating={isStreaming}
      >
        {content}
      </MessageResponse>
    </ChatStreamBlock>
  );
}
