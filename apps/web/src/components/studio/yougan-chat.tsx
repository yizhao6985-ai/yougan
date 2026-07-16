import { useCallback, useMemo, useState } from "react";
import { CompassIcon } from "lucide-react";

import type { Message as LangChainMessage } from "@langchain/langgraph-sdk";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { MessageResponse } from "@/components/ai-elements/message";
import { AIResponse } from "@/components/studio/ai-response";
import {
  ChatStreamBlock,
  chatStreamBlock,
} from "@/components/studio/chat-stream-block";
import { TurnDirectionOptions } from "@/components/studio/turn-direction-options";
import { OpeningTurnDirections } from "@/components/studio/opening-turn-directions";
import { useTurnDirections } from "@/hooks/use-turn-directions";
import { ChatRunLoading } from "@/components/studio/chat-run-loading";
import { ChatTurnActivity } from "@/components/studio/chat-turn-activity";
import { StudioChatComposer } from "@/components/studio/studio-chat-composer";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { useYouganStreamContext } from "@/components/studio/yougan-stream-provider";
import { useWorkItemNameDialog } from "@/hooks/use-work-item-name-dialog";
import { WorksCreateMenu } from "@/components/studio/works-create-menu";
import { useStudioOnboardingOptional } from "@/components/studio/onboarding/studio-onboarding-provider";
import { HumanMessagePreviewSelections } from "@/components/studio/human-message-preview-selections";
import { buildRenderItems, findTurnDirectionsAnchorIndex, mergeChatMessages } from "@/lib/message-utils";
import { scene } from "@/lib/scene-styles";
import { cn } from "@/lib/utils";
import { CHAT_COPY, STUDIO } from "@/lib/site-copy";
import {
  profileSetupPlaceholder,
  profileSetupStatusHint,
  resolveStreamProfile,
} from "@/lib/profile-setup-display";
import { ProductionConfirmPrompt } from "@/components/studio/production-confirm-prompt";
import { ReviseConfirmPrompt } from "@/components/studio/revise-confirm-prompt";
import type { TurnQueueKind, YouganValues } from "@/lib/types";

export function YouganChat() {
  const {
    stream,
    runProgress,
    sendMessage,
    cancelActiveTurn,
    canCancelActiveTurn,
    resumeProductionConfirm,
    resumeReviseConfirm,
    productionConfirmInterrupt,
    reviseConfirmInterrupt,
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
  const onboarding = useStudioOnboardingOptional();
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

  const { activeDirections } = useTurnDirections({
    values: streamValues,
  });

  const openingDirections = useMemo(
    () =>
      items.length === 0
        ? (streamValues?.turnDirections ?? null)
        : null,
    [items.length, streamValues?.turnDirections],
  );

  const openingDirectionItems = openingDirections?.directions ?? [];
  const hasOpeningDirections = openingDirectionItems.length > 0;
  const openingDirectionsKey = useMemo(
    () => openingDirectionItems.map((d) => d.id).join("\u0000"),
    [openingDirectionItems],
  );

  const directionsAnchorIndex = useMemo(
    () => findTurnDirectionsAnchorIndex(items),
    [items],
  );

  /** commit 写入 turnDirections 后即可展示，不必等 summarize / finalize */
  const showDirectionsAtEnd =
    directionsAnchorIndex === -1 &&
    Boolean(activeDirections?.directions.length);

  const showRunLoading =
    stream.isLoading &&
    !productionConfirmInterrupt &&
    !reviseConfirmInterrupt &&
    !items.some((item) => item.kind === "briefing" && item.isStreaming);

  const runLoadingLabel = runProgress?.label ?? CHAT_COPY.replying;

  const handleSend = useCallback(
    async ({
      text,
      previewSelections,
    }: {
      text: string;
      previewSelections: Parameters<typeof sendMessage>[1];
    }) => {
      if (!canSend) return;
      await sendMessage(text, previewSelections);
    },
    [canSend, sendMessage],
  );

  const isRunBusy =
    stream.isLoading ||
    productionConfirmInterrupt != null ||
    reviseConfirmInterrupt != null;
  const chatStatus = !isRunBusy
    ? "ready"
    : canCancelActiveTurn
      ? "streaming"
      : "submitted";

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
          <div className="flex flex-wrap items-center justify-center gap-2">
            <WorksCreateMenu
              onCreateWork={() => openCreateWork()}
              onCreateGroup={() => openCreateGroup()}
              align="center"
            />
            {onboarding ? (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card/85 px-3 py-2 text-sm text-muted-foreground shadow-sm shadow-border/20 transition hover:border-primary/20 hover:bg-accent/40 hover:text-foreground"
                onClick={() => onboarding.startTour()}
              >
                <CompassIcon className="size-3.5 shrink-0 text-primary/80" aria-hidden />
                {STUDIO.emptyTourCta}
              </button>
            ) : null}
          </div>
        </div>
        {workNameDialog}
      </>
    );
  }

  const profile = resolveStreamProfile(activeWork?.profile, stream.values);
  const staging = streamValues?.turn?.staging;
  const preview =
    staging?.preview ??
    streamValues?.preview ??
    activeWork?.preview ??
    null;
  const production =
    staging?.production ??
    streamValues?.production ??
    activeWork?.production ??
    null;
  const profileSetupOptions = { preview, production };

  const turnDirectionsBlock =
    activeDirections && activeDirections.directions.length > 0 ? (
      <TurnDirectionOptions
        directions={activeDirections.directions}
        hint={activeDirections.hint}
        disabled={!canSend}
        onSelect={(value) => void sendMessage(value)}
        className="mt-3"
      />
    ) : null;

  const statusHint = (() => {
    if (productionConfirmInterrupt) {
      return CHAT_COPY.productionConfirm.statusHint;
    }
    if (reviseConfirmInterrupt) {
      return CHAT_COPY.reviseConfirm.statusHint;
    }
    if (stream.isLoading) {
      return runProgress?.label ?? CHAT_COPY.replying;
    }
    switch (activeKind) {
      case "production":
        return CHAT_COPY.status.productionExecuting;
      case "revise":
        return CHAT_COPY.status.productionExecuting;
      case "ask":
        return CHAT_COPY.status.askExploring;
      case "profile":
      default:
        return profileSetupStatusHint(profile, profileSetupOptions);
    }
  })();

  const composerPlaceholder = profileSetupPlaceholder(
    profile,
    activeKind === "profile" || activeKind == null ? "profile" : activeKind,
    profileSetupOptions,
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
              <div className={cn(scene.chatColumn, "flex flex-col items-center gap-5")}>
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
                  ) : hasOpeningDirections ? (
                    <OpeningTurnDirections
                      key={`${activeConversation?.id ?? ""}-${openingDirectionsKey}`}
                      animate
                      directions={openingDirectionItems}
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
                scene.chatColumn,
                "gap-6 px-4 py-4",
                scene.conversationPadBottom,
              )}
            >
              {items.map((item, index) => {
                if (item.kind === "human") {
                  const hasSelections = item.previewSelections.length > 0;
                  const hasText = Boolean(item.content);
                  return (
                    <Message key={item.id} from="user">
                      <MessageContent className="bg-card text-foreground ring-1 ring-border/80">
                        <div className="flex flex-col gap-2">
                          {hasSelections ? (
                            <HumanMessagePreviewSelections
                              items={item.previewSelections}
                            />
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

                if (item.kind === "activity") {
                  const showTurnDirections = index === directionsAnchorIndex;
                  return (
                    <Message
                      key={item.id}
                      from="assistant"
                      className="max-w-full"
                    >
                      <MessageContent className="w-full max-w-full p-0">
                        <ChatTurnActivity
                          label={item.label}
                          detail={item.detail}
                          status={item.status}
                        />
                        {showTurnDirections ? turnDirectionsBlock : null}
                      </MessageContent>
                    </Message>
                  );
                }

                if (item.kind === "briefing") {
                  const trimmedExcerpt = item.excerpt?.trim();
                  const showTurnDirections = index === directionsAnchorIndex;
                  const hasBody = Boolean(item.body.trim());
                  const showExcerpt =
                    trimmedExcerpt &&
                    trimmedExcerpt !== "null" &&
                    trimmedExcerpt !== "undefined";

                  return (
                    <Message
                      key={item.id}
                      from="assistant"
                      className="max-w-full"
                    >
                      <MessageContent className="w-full max-w-full p-0">
                        {hasBody || showExcerpt ? (
                          <ChatStreamBlock>
                            {hasBody ? (
                              <MessageResponse
                                className={cn(
                                  chatStreamBlock.body,
                                  "whitespace-pre-wrap",
                                )}
                                isAnimating={item.isStreaming}
                              >
                                {item.body}
                              </MessageResponse>
                            ) : null}
                            {showExcerpt ? (
                              <p
                                className={cn(
                                  chatStreamBlock.caption,
                                  hasBody ? "mt-2 whitespace-pre-wrap" : "whitespace-pre-wrap",
                                )}
                              >
                                {trimmedExcerpt}
                              </p>
                            ) : null}
                          </ChatStreamBlock>
                        ) : null}
                        {showTurnDirections ? turnDirectionsBlock : null}
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

                const showTurnDirections = index === directionsAnchorIndex;
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
                          {!activeDirections?.directions.length
                            ? ` ${CHAT_COPY.interruptedHint}`
                            : null}
                        </p>
                      ) : null}
                      {showTurnDirections ? turnDirectionsBlock : null}
                    </MessageContent>
                  </Message>
                );
              })}

              {showDirectionsAtEnd ? (
                <Message from="assistant" className="max-w-full">
                  <MessageContent className="w-full max-w-full p-0">
                    {turnDirectionsBlock}
                  </MessageContent>
                </Message>
              ) : null}

              {productionConfirmInterrupt ? (
                <ProductionConfirmPrompt
                  interrupt={productionConfirmInterrupt}
                  disabled={isResumingInterrupt}
                  onConfirm={() => void resumeProductionConfirm("confirm")}
                  onDecline={() => void resumeProductionConfirm("decline")}
                />
              ) : null}

              {reviseConfirmInterrupt ? (
                <ReviseConfirmPrompt
                  interrupt={reviseConfirmInterrupt}
                  disabled={isResumingInterrupt}
                  onConfirm={() => void resumeReviseConfirm("confirm")}
                  onDecline={() => void resumeReviseConfirm("decline")}
                />
              ) : null}

              {showRunLoading ? (
                <ChatRunLoading label={runLoadingLabel} />
              ) : null}
            </ConversationContent>
            <ConversationScrollButton
              className={scene.conversationScrollButton}
            />
          </Conversation>
        )}

        <div className={scene.composer} data-onboarding="chat-composer">
          <div className={cn(scene.chatColumn, "pointer-events-auto")}>
            <StudioChatComposer
              input={input}
              onInputChange={setInput}
              onSend={handleSend}
              onStop={canCancelActiveTurn ? cancelActiveTurn : undefined}
              chatStatus={chatStatus}
              placeholder={composerPlaceholder}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
