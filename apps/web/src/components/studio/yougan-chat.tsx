import { useCallback, useMemo, useState } from "react";

import type { Message as LangChainMessage } from "@langchain/langgraph-sdk";

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
import { NextStepSuggestionOptions } from "@/components/studio/next-step-suggestion-options";
import { OpeningNextStepSuggestions } from "@/components/studio/opening-next-step-suggestions";
import { useTurnNextStepSuggestions } from "@/hooks/use-turn-next-step-suggestions";
import { ChatLoadingDots } from "@/components/studio/chat-loading-dots";
import { ChatRunProgress } from "@/components/studio/chat-run-progress";
import { StudioChatComposer } from "@/components/studio/studio-chat-composer";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { useYouganStreamContext } from "@/components/studio/yougan-stream-provider";
import { useWorkItemNameDialog } from "@/hooks/use-work-item-name-dialog";
import { WorksCreateMenu } from "@/components/studio/works-create-menu";
import { HumanMessageAttachments } from "@/components/studio/human-message-attachments";
import { buildRenderItems, mergeChatMessages } from "@/lib/message-utils";
import { scene } from "@/lib/scene-styles";
import { cn } from "@/lib/utils";
import { CHAT_COPY, STUDIO } from "@/lib/site-copy";
import {
  profileSetupPlaceholder,
  profileSetupStatusHint,
  resolveStreamProfile,
} from "@/lib/profile-setup-display";
import { ProductionConfirmPrompt } from "@/components/studio/production-confirm-prompt";
import type { TurnQueueKind, YouganValues } from "@/lib/types";

export function YouganChat() {
  const {
    stream,
    runProgress,
    sendMessage,
    cancelActiveTurn,
    resumeProductionConfirm,
    productionConfirmInterrupt,
    isResumingInterrupt,
    canSend,
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

  const streamValues = stream.values as YouganValues | undefined;

  const activeKind = streamValues?.turn?.activeKind as
    | TurnQueueKind
    | undefined;

  const interruptedMessageIds =
    streamValues?.turn?.interruptedMessageIds ?? [];

  const chatMessages = useMemo(
    () =>
      mergeChatMessages(
        stream.messages,
        streamValues?.messages as LangChainMessage[] | undefined,
      ),
    [stream.messages, streamValues?.messages],
  );

  const items = useMemo(
    () =>
      buildRenderItems(
        chatMessages,
        stream.isLoading,
        interruptedMessageIds,
      ),
    [chatMessages, stream.isLoading, interruptedMessageIds],
  );

  const { activeSuggestions } = useTurnNextStepSuggestions({
    values: streamValues,
    isLoading: stream.isLoading,
  });

  const openingSuggestions = useMemo(
    () =>
      items.length === 0
        ? (streamValues?.nextStepSuggestions ?? null)
        : null,
    [items.length, streamValues?.nextStepSuggestions],
  );

  const openingSuggestionItems = openingSuggestions?.suggestions ?? [];
  const hasOpeningSuggestions = openingSuggestionItems.length > 0;
  const openingSuggestionsKey = useMemo(
    () => openingSuggestionItems.map((s) => s.id).join("\u0000"),
    [openingSuggestionItems],
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
    async ({
      text,
      attachments,
    }: {
      text: string;
      attachments: Parameters<typeof sendMessage>[1];
    }) => {
      if (!canSend) return;
      await sendMessage(text, attachments);
    },
    [canSend, sendMessage],
  );

  const chatStatus =
    stream.isLoading || productionConfirmInterrupt ? "streaming" : "ready";

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

  const profile = resolveStreamProfile(activeWork?.profile, stream.values);

  const statusHint = (() => {
    if (productionConfirmInterrupt) {
      return CHAT_COPY.productionConfirm.statusHint;
    }
    if (stream.isLoading && runProgress?.label) {
      return runProgress.detail?.trim()
        ? `${runProgress.label} · ${runProgress.detail.trim()}`
        : runProgress.label;
    }
    switch (activeKind) {
      case "reference":
        return CHAT_COPY.status.referenceProcessing;
      case "production":
        return CHAT_COPY.status.productionExecuting;
      case "ask":
        return CHAT_COPY.status.askExploring;
      case "profile":
      default:
        return profileSetupStatusHint(profile);
    }
  })();

  const conversationRunProgress = runProgress?.label
    ? {
        label: runProgress.label,
        detail: runProgress.detail?.trim() || null,
      }
    : stream.isLoading
      ? { label: statusHint, detail: null }
      : null;

  const composerPlaceholder = profileSetupPlaceholder(
    profile,
    activeKind === "profile" || activeKind == null ? "profile" : activeKind,
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className={scene.studioPanelHeader}>
        <p className={scene.studioPanelHeaderTitle}>
          {activeConversation?.title ?? activeWork.title}
        </p>
        <p className={scene.studioPanelHeaderHint}>{statusHint}</p>
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
                  {isBootstrappingOpening ? (
                    <div className="flex w-full justify-center py-2">
                      <Shimmer className={cn(chatStreamBlock.muted, "text-center")}>
                        {CHAT_COPY.openingSuggestionsLoading}
                      </Shimmer>
                    </div>
                  ) : hasOpeningSuggestions ? (
                    <OpeningNextStepSuggestions
                      key={`${activeConversation?.id ?? ""}-${openingSuggestionsKey}`}
                      animate
                      suggestions={openingSuggestionItems}
                      disabled={!canSend}
                      onSelect={(value) => void sendMessage(value)}
                    />
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
                  const hasAttachments = item.attachments.length > 0;
                  const hasText = Boolean(item.content);
                  return (
                    <Message key={item.id} from="user">
                      <MessageContent className="bg-card text-foreground ring-1 ring-border/80">
                        <div className="flex flex-col gap-2">
                          {hasAttachments ? (
                            <HumanMessageAttachments items={item.attachments} />
                          ) : null}
                          {hasText ? (
                            <p className="whitespace-pre-wrap break-words">
                              {item.content}
                            </p>
                          ) : null}
                        </div>
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
                  isLastAi && Boolean(activeSuggestions?.suggestions.length);
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
                      {item.isInterrupted ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {CHAT_COPY.interrupted}
                        </p>
                      ) : null}
                      {showTurnSuggestions && activeSuggestions && (
                        <NextStepSuggestionOptions
                          suggestions={activeSuggestions.suggestions}
                          hint={activeSuggestions.hint}
                          profile={profile}
                          disabled={!canSend}
                          onSelect={(value) => void sendMessage(value)}
                        />
                      )}
                    </MessageContent>
                  </Message>
                );
              })}

              {productionConfirmInterrupt ? (
                <ProductionConfirmPrompt
                  interrupt={productionConfirmInterrupt}
                  disabled={isResumingInterrupt}
                  onConfirm={() => void resumeProductionConfirm("confirm")}
                  onDecline={() => void resumeProductionConfirm("decline")}
                />
              ) : null}

              {showShimmer && (
                <Message from="assistant" className="max-w-full">
                  <MessageContent className="w-full max-w-full p-0">
                    {conversationRunProgress ? (
                      <ChatRunProgress
                        label={conversationRunProgress.label}
                        detail={conversationRunProgress.detail}
                      />
                    ) : (
                      <ChatLoadingDots />
                    )}
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
                input={input}
                onInputChange={setInput}
                onSend={handleSend}
                onStop={cancelActiveTurn}
                chatStatus={chatStatus}
                placeholder={composerPlaceholder}
              />
            </ComposerAttachmentsProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
