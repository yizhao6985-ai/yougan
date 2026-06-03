import { useCallback, useMemo, useState } from "react";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { AIResponse } from "@/components/studio/ai-response";
import {
  ChatStreamBlock,
  chatStreamBlock,
} from "@/components/studio/chat-stream-block";
import { ComposerAttachmentsProvider } from "@/components/studio/composer-attachments-context";
import { ChatToolActivity } from "@/components/studio/chat-tool-activity";
import { BriefSuggestionOptions } from "@/components/studio/inspiration-generative-ui";
import { OpeningNextStepSuggestions } from "@/components/studio/opening-next-step-suggestions";
import { normalizeBriefSuggestions } from "@/lib/brief-ui-spec";
import { useTurnNextStepSuggestions } from "@/hooks/use-turn-next-step-suggestions";
import { StudioChatComposer } from "@/components/studio/studio-chat-composer";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { useYouganStreamContext } from "@/components/studio/yougan-stream-provider";
import { useWorkItemNameDialog } from "@/hooks/use-work-item-name-dialog";
import { WorksCreateMenu } from "@/components/studio/works-create-menu";
import { buildRenderItems } from "@/lib/message-utils";
import { scene } from "@/lib/scene-styles";
import { cn } from "@/lib/utils";
import { CHAT_COPY, STUDIO } from "@/lib/site-copy";
import type { TurnQueueKind } from "@/lib/types";

export function YouganChat() {
  const {
    stream,
    sendMessage,
    canChat,
    isBootstrappingOpening,
    activeWork,
    activeConversation,
  } = useYouganStreamContext();
  const {
    dialog: workNameDialog,
    openCreateWork,
    openCreateGroup,
  } = useWorkItemNameDialog();
  const [input, setInput] = useState("");

  const streamValues = stream.values;

  const activeKind = streamValues?.activeTurnKind as TurnQueueKind | undefined;

  const items = useMemo(
    () => buildRenderItems(stream.messages, stream.isLoading),
    [stream.messages, stream.isLoading],
  );

  const { activeSuggestions } = useTurnNextStepSuggestions({
    values: streamValues,
    isLoading: stream.isLoading,
  });

  const openingSuggestions = useMemo(
    () =>
      items.length === 0
        ? normalizeBriefSuggestions(streamValues?.openingNextStepSuggestions)
        : null,
    [items.length, streamValues?.openingNextStepSuggestions],
  );

  const openingSuggestionsKey = useMemo(
    () => openingSuggestions?.suggestions.map((s) => s.id).join("\u0000") ?? "",
    [openingSuggestions],
  );

  const lastAiIndex = useMemo(() => {
    for (let i = items.length - 1; i >= 0; i--) {
      if (items[i]?.kind === "ai") return i;
    }
    return -1;
  }, [items]);

  const hasStreamingAi = items.some(
    (item) => item.kind === "ai" && item.isStreaming,
  );
  const hasStreamingTool = items.some(
    (item) => item.kind === "tool" && item.isStreaming,
  );
  const showShimmer =
    stream.isLoading &&
    !hasStreamingAi &&
    !hasStreamingTool &&
    items.length > 0 &&
    items[items.length - 1]?.kind === "human";

  const handleSend = useCallback(
    async ({ text, imageUrls }: { text: string; imageUrls: string[] }) => {
      if (stream.isLoading || !canChat) return;
      await sendMessage(text, imageUrls);
    },
    [canChat, sendMessage, stream.isLoading],
  );

  const chatStatus = stream.isLoading ? "streaming" : "ready";

  if (!activeWork) {
    return (
      <>
        <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-y-auto px-6 py-12 text-center">
          <p className="text-lg font-medium text-foreground">
            {STUDIO.emptyTitle}
          </p>
          <p className="max-w-md text-sm text-muted-foreground">
            {STUDIO.emptyBody}
          </p>
          <WorksCreateMenu
            onCreateWork={() => openCreateWork()}
            onCreateGroup={() => openCreateGroup()}
            align="center"
          />
        </div>
        {workNameDialog}
      </>
    );
  }

  const brief = stream.values?.brief ?? activeWork.brief;
  const outline = stream.values?.outline ?? activeWork.outline;
  const briefCount = brief.requirements?.length ?? 0;
  const outlineCount = outline.sections?.length ?? 0;

  const statusHint = (() => {
    switch (activeKind) {
      case "creation":
        return CHAT_COPY.status.creationExecuting;
      case "ask":
        return CHAT_COPY.status.askExploring;
      case "outline":
        return outlineCount > 0
          ? CHAT_COPY.status.outlineEditing(outlineCount)
          : CHAT_COPY.status.outlineGenerating;
      case "inspiration":
      default:
        return briefCount > 0
          ? CHAT_COPY.status.inspirationConfirmed(briefCount)
          : CHAT_COPY.status.inspirationExploring;
    }
  })();

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className={scene.studioPanelHeader}>
        <p className={scene.studioPanelHeaderTitle}>
          {activeConversation?.title ?? activeWork.title}
        </p>
        <p className={scene.studioPanelHeaderHint}>
          {[activeWork.title, statusHint].join(" · ")}
        </p>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {items.length === 0 ? (
          <div
            className={cn(
              "flex h-full min-h-0 flex-col overflow-y-auto px-4 py-8",
              scene.conversationPadBottom,
            )}
          >
            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-5">
                <p className="shrink-0 text-center text-lg font-medium text-foreground">
                  {CHAT_COPY.emptyTitle}
                </p>
                <div className={scene.openingSuggestionsSlot}>
                  {!isBootstrappingOpening && openingSuggestions ? (
                    <OpeningNextStepSuggestions
                      key={`${activeConversation?.id ?? ""}-${openingSuggestionsKey}`}
                      animate
                      suggestions={openingSuggestions.suggestions}
                      disabled={!canChat}
                      onSelect={(value) => void sendMessage(value)}
                    />
                  ) : isBootstrappingOpening ? (
                    <div className="flex w-full justify-center py-2">
                      <Shimmer className={cn(chatStreamBlock.muted, "text-center")}>
                        {CHAT_COPY.openingSuggestionsLoading}
                      </Shimmer>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Conversation className="h-full min-h-0">
            <ConversationContent
              className={cn(
                "mx-auto w-full max-w-3xl gap-6 px-4 py-4",
                scene.conversationPadBottom,
              )}
            >
              {items.map((item, index) => {
                if (item.kind === "human") {
                  return (
                    <Message key={item.id} from="user">
                      <MessageContent className="whitespace-pre-wrap break-words bg-card text-foreground ring-1 ring-border/80">
                        {item.content}
                      </MessageContent>
                    </Message>
                  );
                }

                if (item.kind === "system") {
                  return (
                    <Message
                      key={item.id}
                      from="assistant"
                      className="max-w-full"
                    >
                      <MessageContent className="w-full max-w-full p-0">
                        <ChatStreamBlock tone="muted">
                          <p
                            className={cn(
                              chatStreamBlock.muted,
                              "whitespace-pre-wrap break-words",
                            )}
                          >
                            {item.content}
                          </p>
                        </ChatStreamBlock>
                      </MessageContent>
                    </Message>
                  );
                }

                if (item.kind === "tool") {
                  return (
                    <Message
                      key={item.id}
                      from="assistant"
                      className="max-w-full"
                    >
                      <MessageContent className="w-full max-w-full p-0">
                        <ChatToolActivity
                          toolName={item.toolName}
                          toolInput={item.toolInput}
                          toolOutput={item.toolOutput}
                          toolError={item.toolError}
                          isStreaming={item.isStreaming}
                        />
                      </MessageContent>
                    </Message>
                  );
                }

                const isLastAi = index === lastAiIndex;
                const showTurnSuggestions =
                  isLastAi &&
                  Boolean(activeSuggestions?.suggestions.length) &&
                  !stream.isLoading;
                return (
                  <Message
                    key={item.id}
                    from="assistant"
                    className="max-w-full"
                  >
                    <MessageContent className="w-full max-w-full">
                      <AIResponse
                        content={item.content}
                        isStreaming={item.isStreaming}
                      />
                      {showTurnSuggestions && activeSuggestions && (
                        <BriefSuggestionOptions
                          suggestions={activeSuggestions.suggestions}
                          hint={activeSuggestions.hint}
                          disabled={stream.isLoading || !canChat}
                          onSelect={(value) => void sendMessage(value)}
                        />
                      )}
                    </MessageContent>
                  </Message>
                );
              })}

              {showShimmer && (
                <Message from="assistant" className="max-w-full">
                  <MessageContent className="w-full max-w-full p-0">
                    <ChatStreamBlock>
                      <Shimmer className={chatStreamBlock.muted}>
                        {CHAT_COPY.replying}
                      </Shimmer>
                    </ChatStreamBlock>
                  </MessageContent>
                </Message>
              )}
            </ConversationContent>
            <ConversationScrollButton
              className={scene.conversationScrollButton}
            />
          </Conversation>
        )}

        <div className={scene.composer}>
          <div className="pointer-events-auto mx-auto w-full max-w-3xl">
            <ComposerAttachmentsProvider>
              <StudioChatComposer
                activeTurnKind={activeKind}
                input={input}
                onInputChange={setInput}
                onSend={handleSend}
                chatStatus={chatStatus}
              />
            </ComposerAttachmentsProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
