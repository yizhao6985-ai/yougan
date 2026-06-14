import { BookOpenIcon, MessageSquareTextIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { HelpChatMessage } from "../types";
import { cn } from "../lib/cn";
import { helpChatStyles } from "../lib/help-chat-styles";

type HelpChatMessagesProps = {
  messages: HelpChatMessage[];
  emptyTitle?: string;
  emptyDescription?: string;
  starterQuestions?: string[];
  isStreaming?: boolean;
  onSelectStarter?: (question: string) => void;
};

function StreamingIndicator() {
  return (
    <span className="inline-flex items-center gap-1 pl-0.5" aria-hidden>
      <span className={helpChatStyles.streamingDot} />
      <span className={cn(helpChatStyles.streamingDot, "[animation-delay:150ms]")} />
      <span className={cn(helpChatStyles.streamingDot, "[animation-delay:300ms]")} />
    </span>
  );
}

function MessageBubble({ message }: { message: HelpChatMessage }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end" data-role="user">
        <div className={helpChatStyles.userBubble}>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  const showStreaming = message.streaming && !message.content;

  return (
    <div className="flex justify-start" data-role="assistant">
      <div
        className={cn(
          helpChatStyles.assistantBubble,
          message.error && helpChatStyles.assistantError,
        )}
      >
        <div className={helpChatStyles.prose}>
          {showStreaming ? (
            <StreamingIndicator />
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content || "…"}
            </ReactMarkdown>
          )}
          {message.streaming && message.content ? (
            <StreamingIndicator />
          ) : null}
        </div>

        {!message.error && message.sources && message.sources.length > 0 ? (
          <div className={helpChatStyles.sourcesWrap}>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <BookOpenIcon className="size-3.5" aria-hidden />
              参考文档
            </p>
            <div className="flex flex-wrap gap-2">
              {message.sources.slice(0, 3).map((source) => (
                <span
                  key={`${source.file}-${source.section}`}
                  className={helpChatStyles.sourceChip}
                >
                  {source.section}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function HelpChatMessages({
  messages,
  emptyTitle = "有什么想了解的？",
  emptyDescription = "例如：有感是什么、如何开始创作、会员与发布相关说明。",
  starterQuestions = [],
  isStreaming = false,
  onSelectStarter,
}: HelpChatMessagesProps) {
  if (messages.length === 0) {
    return (
      <div className={helpChatStyles.emptyWrap}>
        <div className={helpChatStyles.emptyIcon}>
          <MessageSquareTextIcon className="size-6" aria-hidden />
        </div>
        <div className="mt-4 max-w-md space-y-2 text-center">
          <p className="text-base font-medium text-foreground">{emptyTitle}</p>
          <p className="text-sm leading-6 text-muted-foreground">
            {emptyDescription}
          </p>
        </div>
        {starterQuestions.length > 0 ? (
          <div className="mt-6 grid w-full max-w-lg gap-2.5">
            {starterQuestions.map((question) => (
              <button
                key={question}
                type="button"
                disabled={isStreaming}
                className={helpChatStyles.suggestionChip}
                onClick={() => onSelectStarter?.(question)}
              >
                {question}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={helpChatStyles.messages}>
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
}
