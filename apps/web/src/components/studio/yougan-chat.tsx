import { CheckIcon, CopyIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { AIResponse } from "@/components/studio/ai-response";
import { ChatToolActivity } from "@/components/studio/chat-tool-activity";
import { InspirationChoiceOptions } from "@/components/studio/inspiration-generative-ui";
import { useInspirationChoices } from "@/hooks/use-inspiration-choices";
import {
  ChatModeSwitcher,
  useChatModeShortcuts,
} from "@/components/studio/chat-mode-switcher";
import { ModelTemperatureControl } from "@/components/studio/model-temperature-control";
import { UploadReferenceButton } from "@/components/studio/upload-reference-button";
import { InspirationRecommendations } from "@/components/studio/inspiration-recommendations";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { useYouganStreamContext } from "@/components/studio/yougan-stream-provider";
import { useWorkInspirationRecommendationsQuery } from "@/hooks/queries/inspiration-recommendations";
import { useWorkItemNameDialog } from "@/hooks/use-work-item-name-dialog";
import { modeShortcutLabel } from "@/lib/chat-mode-config";
import { buildRenderItems } from "@/lib/message-utils";
import { scene } from "@/lib/scene-styles";
import { CHAT_COPY, STUDIO } from "@/lib/site-copy";
import type { ChatMode } from "@/lib/types";

export function YouganChat() {
  const {
    stream,
    sendMessage,
    canChat,
    activeWork,
    setWorkMode,
    resolvedValues,
    modelTemperatureLevel,
    setModelTemperatureLevel,
  } = useYouganStreamContext();
  const { dialog: workNameDialog, openCreateWork } = useWorkItemNameDialog();
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  const mode = activeWork?.mode ?? ("inspiration" as ChatMode);

  const handleModeSwitch = useCallback(
    (nextMode: ChatMode) => {
      if (!activeWork || mode === nextMode) return;
      setWorkMode(activeWork.id, nextMode);
    },
    [activeWork, mode, setWorkMode],
  );

  useChatModeShortcuts(Boolean(activeWork), mode, handleModeSwitch);

  const items = useMemo(
    () => buildRenderItems(stream.messages, stream.isLoading),
    [stream.messages, stream.isLoading],
  );

  const { activeChoices } = useInspirationChoices(mode, {
    values: resolvedValues,
    isLoading: stream.isLoading,
  });

  const shouldSuggestInspirations =
    Boolean(activeWork) &&
    mode === "inspiration" &&
    items.length === 0;

  const inspirationRecommendationsQuery = useWorkInspirationRecommendationsQuery(
    activeWork?.id,
    activeWork?.title,
    shouldSuggestInspirations,
  );

  const inspirationRecommendations =
    inspirationRecommendationsQuery.data?.recommendations ?? [];

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

  const handleSubmit = useCallback(
    async (message: { text: string }) => {
      if (!message.text.trim() || stream.isLoading || !canChat) return;
      setInput("");
      await sendMessage(message.text);
    },
    [canChat, sendMessage, stream.isLoading],
  );

  const handleCopyLast = useCallback(() => {
    const lastAi = [...items].reverse().find((item) => item.kind === "ai");
    if (!lastAi || lastAi.kind !== "ai") return;
    navigator.clipboard.writeText(lastAi.content).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [items]);

  const chatStatus = stream.isLoading ? "streaming" : "ready";
  const suggestions =
    mode === "creation"
      ? CHAT_COPY.creationSuggestions
      : mode === "outline"
        ? CHAT_COPY.outlineSuggestions
        : CHAT_COPY.inspirationSuggestions;

  if (!activeWork) {
    return (
      <>
        <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-y-auto px-6 py-12 text-center">
          <p className="text-lg font-medium text-foreground">{STUDIO.emptyTitle}</p>
          <p className="max-w-md text-sm text-muted-foreground">{STUDIO.emptyBody}</p>
          <button
            type="button"
            onClick={() => openCreateWork()}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            {STUDIO.newWork}
          </button>
        </div>
        {workNameDialog}
      </>
    );
  }

  const pendingCount = activeWork.outline.pending_changes?.length ?? 0;
  const confirmedCount =
    activeWork.inspiration.confirmed_requirements?.length ?? 0;
  const outlineReady = activeWork.outline.outline_ready ?? false;

  const statusHint =
    mode === "inspiration"
      ? confirmedCount > 0
        ? CHAT_COPY.status.inspirationConfirmed(confirmedCount)
        : CHAT_COPY.status.inspirationExploring
      : mode === "outline"
        ? outlineReady
          ? CHAT_COPY.status.outlineReady
          : pendingCount > 0
            ? CHAT_COPY.status.outlinePending(pendingCount)
            : CHAT_COPY.status.outlineDraft
        : pendingCount > 0
          ? CHAT_COPY.status.creationPending(pendingCount)
          : CHAT_COPY.status.creationIdle;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className={scene.studioPanelHeader}>
        <p className={scene.studioPanelHeaderTitle}>{activeWork.title}</p>
        <p className={scene.studioPanelHeaderHint}>{statusHint}</p>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
      {items.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-6 overflow-y-auto px-4 py-8">
          <div className="text-center">
            <p className="text-lg font-medium text-foreground">
              {mode === "inspiration"
                ? CHAT_COPY.emptyByMode.inspiration.title
                : mode === "outline"
                  ? CHAT_COPY.emptyByMode.outline.title
                  : CHAT_COPY.emptyByMode.creation.title}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "inspiration"
                ? shouldSuggestInspirations &&
                  inspirationRecommendations.length > 0
                  ? CHAT_COPY.emptyByMode.inspiration.bodyWithRecommendations
                  : CHAT_COPY.emptyByMode.inspiration.bodyDefault
                : mode === "outline"
                  ? CHAT_COPY.emptyByMode.outline.body
                  : CHAT_COPY.emptyByMode.creation.body}
            </p>
          </div>
          {mode === "inspiration" && shouldSuggestInspirations ? (
            inspirationRecommendationsQuery.isLoading ? (
              <Suggestions>
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className="inline-flex rounded-full border border-border bg-background px-4 py-2"
                  >
                    <Shimmer className="text-sm">
                      {CHAT_COPY.generatingInspirations}
                    </Shimmer>
                  </div>
                ))}
              </Suggestions>
            ) : inspirationRecommendations.length > 0 ? (
              <InspirationRecommendations
                recommendations={inspirationRecommendations}
                disabled={stream.isLoading || !canChat}
                onSelect={(suggestion) => void sendMessage(suggestion)}
              />
            ) : (
              <Suggestions>
                {suggestions.map((prompt) => (
                  <Suggestion
                    key={prompt}
                    suggestion={prompt}
                    onClick={() => void sendMessage(prompt)}
                  />
                ))}
              </Suggestions>
            )
          ) : (
            <Suggestions>
              {suggestions.map((prompt) => (
                <Suggestion
                  key={prompt}
                  suggestion={prompt}
                  onClick={() => void sendMessage(prompt)}
                />
              ))}
            </Suggestions>
          )}
        </div>
      ) : (
        <Conversation className="h-full min-h-0">
          <ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-4 py-4">
            {items.map((item, index) => {
              if (item.kind === "human") {
                return (
                  <Message key={item.id} from="user">
                    <MessageContent className="whitespace-pre-wrap break-words">
                      {item.content}
                    </MessageContent>
                  </Message>
                );
              }

              if (item.kind === "system") {
                return (
                  <Message key={item.id} from="assistant">
                    <MessageContent className="rounded-xl border border-dashed border-border/80 bg-muted/40 px-3 py-2 text-xs leading-6 text-muted-foreground whitespace-pre-wrap break-words">
                      {item.content}
                    </MessageContent>
                  </Message>
                );
              }

              if (item.kind === "tool") {
                return (
                  <Message key={item.id} from="assistant" className="max-w-full">
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
              const showInspirationChoices =
                isLastAi &&
                mode === "inspiration" &&
                Boolean(activeChoices?.options.length) &&
                !stream.isLoading;
              return (
                <Message key={item.id} from="assistant" className="max-w-full">
                  <MessageContent className="w-full max-w-full">
                    <AIResponse
                      content={item.content}
                      reasoning={item.reasoning}
                      isStreaming={item.isStreaming}
                    />
                    {showInspirationChoices && activeChoices && (
                      <InspirationChoiceOptions
                        options={activeChoices.options}
                        hint={activeChoices.hint}
                        disabled={stream.isLoading || !canChat}
                        onSelect={(value) => void sendMessage(value)}
                      />
                    )}
                  </MessageContent>
                  {isLastAi && !stream.isLoading && item.content.trim() && (
                    <MessageActions>
                      <MessageAction
                        tooltip={copied ? "已复制" : "复制"}
                        onClick={handleCopyLast}
                      >
                        {copied ? (
                          <CheckIcon className="size-4" />
                        ) : (
                          <CopyIcon className="size-4" />
                        )}
                      </MessageAction>
                    </MessageActions>
                  )}
                </Message>
              );
            })}

            {showShimmer && (
              <Message from="assistant">
                <MessageContent>
                  <Shimmer>{CHAT_COPY.thinking}</Shimmer>
                </MessageContent>
              </Message>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      )}
      </div>

      <div className={scene.composer}>
        <PromptInput
          className="mx-auto max-w-3xl"
          onSubmit={(message) => void handleSubmit(message)}
        >
          <PromptInputBody>
            <PromptInputTextarea
              placeholder={CHAT_COPY.placeholders[mode]}
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools className="flex-wrap gap-2">
              <UploadReferenceButton />
              <ModelTemperatureControl
                level={modelTemperatureLevel}
                onChange={setModelTemperatureLevel}
                disabled={stream.isLoading}
              />
              <ChatModeSwitcher
                mode={mode}
                onChange={handleModeSwitch}
                disabled={stream.isLoading}
              />
            </PromptInputTools>
            <PromptInputSubmit disabled={!input.trim()} status={chatStatus} />
          </PromptInputFooter>
        </PromptInput>
        <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-muted-foreground/70">
          {CHAT_COPY.modeShortcutsFooter({
            inspiration: modeShortcutLabel("inspiration"),
            outline: modeShortcutLabel("outline"),
            creation: modeShortcutLabel("creation"),
          })}
        </p>
      </div>
    </div>
  );
}
