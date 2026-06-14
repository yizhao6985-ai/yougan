import { MessageSquareTextIcon, RotateCcwIcon, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useHelpChatConfig } from "../context/help-chat-config";
import { useHelpChat } from "../hooks/use-help-chat";
import { cn } from "../lib/cn";
import { helpChatStyles } from "../lib/help-chat-styles";
import { HelpChatComposer } from "./help-chat-composer";
import { HelpChatMessages } from "./help-chat-messages";

type HelpChatPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function HelpChatPanel({ open, onOpenChange }: HelpChatPanelProps) {
  const {
    panelTitle,
    panelDescription,
    emptyTitle,
    emptyDescription,
    composerPlaceholder,
    sendLabel,
    closeLabel,
    starterQuestions,
  } = useHelpChatConfig();
  const { messages, isStreaming, error, sendMessage, resetConversation } =
    useHelpChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSend = useCallback(
    async (text: string) => {
      const sent = await sendMessage(text);
      if (sent) setInput("");
      return sent;
    },
    [sendMessage],
  );

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onOpenChange, open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <>
      <button
        type="button"
        aria-label={closeLabel}
        className={cn(
          helpChatStyles.overlay,
          "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200",
        )}
        onClick={() => onOpenChange(false)}
      />

      <div
        className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8"
        role="presentation"
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-label={panelTitle}
          style={{
            height: "min(90vh, 860px)",
            minHeight: "680px",
          }}
          className={cn(
            "pointer-events-auto relative flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl",
            helpChatStyles.shell,
            "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:zoom-in-95 motion-safe:duration-200",
          )}
          onClick={(event) => event.stopPropagation()}
        >
        <header className={helpChatStyles.header}>
          <div className="flex min-w-0 items-start gap-3">
            <div className={helpChatStyles.headerIcon}>
              <MessageSquareTextIcon className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 className={helpChatStyles.headerTitle}>{panelTitle}</h2>
              <p className={helpChatStyles.headerHint}>{panelDescription}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              aria-label="重新开始对话"
              className={helpChatStyles.iconButton}
              onClick={resetConversation}
            >
              <RotateCcwIcon className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              aria-label={closeLabel}
              className={helpChatStyles.iconButton}
              onClick={() => onOpenChange(false)}
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        </header>

        <div ref={scrollRef} className={helpChatStyles.body}>
          <HelpChatMessages
            messages={messages}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
            starterQuestions={starterQuestions}
            isStreaming={isStreaming}
            onSelectStarter={(question) => void handleSend(question)}
          />
        </div>

        {error ? (
          <p className="shrink-0 border-t border-destructive/20 bg-destructive/5 px-5 py-2.5 text-sm text-destructive sm:px-6">
            {error}
          </p>
        ) : null}

        <HelpChatComposer
          value={input}
          onChange={setInput}
          onSubmit={handleSend}
          disabled={isStreaming}
          placeholder={composerPlaceholder}
          sendLabel={sendLabel}
          autoFocus
        />
      </section>
      </div>
    </>,
    document.body,
  );
}
