import { useCallback, type KeyboardEventHandler } from "react";

import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { ComposerPreviewSelectionTags } from "@/components/studio/composer-preview-selection-tags";
import { useComposerPreviewSelectionsContext } from "@/components/studio/composer-preview-selections-context";
import { ModelTemperatureControl } from "@/components/studio/model-temperature-control";
import { useYouganStreamContext } from "@/components/studio/yougan-stream-provider";
import { scene } from "@/lib/scene-styles";
import type { HumanPreviewSelection } from "@yougan/domain";
import { CHAT_COPY } from "@/lib/site-copy";

type StudioChatComposerProps = {
  input: string;
  onInputChange: (value: string) => void;
  onSend: (payload: {
    text: string;
    previewSelections: HumanPreviewSelection[];
  }) => void | Promise<void>;
  onStop?: () => void | Promise<void>;
  chatStatus: "ready" | "submitted" | "streaming" | "error";
  placeholder?: string;
};

export function StudioChatComposer({
  input,
  onInputChange,
  onSend,
  onStop,
  chatStatus,
  placeholder,
}: StudioChatComposerProps) {
  const {
    canSend,
    usageExceeded,
    modelTemperatureLevel,
    setModelTemperatureLevel,
  } = useYouganStreamContext();
  const {
    clear: clearPreviewSelections,
    toPayload: previewSelectionsPayload,
    hasSelections,
    items: previewSelectionItems,
    remove: removePreviewSelection,
  } = useComposerPreviewSelectionsContext();

  const handleSubmit = useCallback(
    async (message: { text: string }) => {
      const previewSelections = previewSelectionsPayload();
      const trimmed = message.text.trim();
      if (
        (!trimmed && previewSelections.length === 0) ||
        (hasSelections && !trimmed) ||
        !canSend
      ) {
        return;
      }
      onInputChange("");
      clearPreviewSelections();
      await onSend({ text: trimmed, previewSelections });
    },
    [
      canSend,
      clearPreviewSelections,
      hasSelections,
      onInputChange,
      onSend,
      previewSelectionsPayload,
    ],
  );

  const handleTextareaKeyDown: KeyboardEventHandler<HTMLTextAreaElement> =
    useCallback(
      (event) => {
        if (
          event.key === "Backspace" &&
          event.currentTarget.value === "" &&
          previewSelectionItems.length > 0
        ) {
          event.preventDefault();
          const lastItem = previewSelectionItems.at(-1);
          if (lastItem) {
            removePreviewSelection(lastItem.id);
          }
        }
      },
      [previewSelectionItems, removePreviewSelection],
    );

  const canSubmit =
    Boolean(input.trim()) &&
    (!hasSelections || Boolean(input.trim())) &&
    canSend;

  return (
    <PromptInput
      className={scene.composerFloatingInput}
      onSubmit={(message) => void handleSubmit(message)}
    >
      <PromptInputBody>
        <div
          className="flex w-full flex-1 flex-wrap items-start gap-1 px-3 py-3.5 min-h-[4.5rem]"
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("button")) {
              return;
            }
            const textarea = event.currentTarget.querySelector(
              "[data-yougan-composer-textarea]",
            ) as HTMLTextAreaElement | null;
            textarea?.focus();
          }}
        >
          <ComposerPreviewSelectionTags inline />
          <PromptInputTextarea
            data-yougan-composer-textarea
            className="field-sizing-content max-h-48 min-h-6 min-w-[8rem] flex-1 px-0 py-0 text-sm leading-6"
            placeholder={
              usageExceeded
                ? CHAT_COPY.quotaExceededPlaceholder
                : hasSelections
                  ? CHAT_COPY.previewSelection.composerPlaceholder
                  : (placeholder ?? CHAT_COPY.placeholderDefault)
            }
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={handleTextareaKeyDown}
          />
        </div>
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputTools className="flex-wrap gap-2">
          <ModelTemperatureControl
            level={modelTemperatureLevel}
            onChange={setModelTemperatureLevel}
          />
        </PromptInputTools>
        <PromptInputSubmit
          disabled={!canSubmit && chatStatus !== "streaming"}
          status={chatStatus}
          onStop={onStop ? () => void onStop() : undefined}
          sendTooltip={CHAT_COPY.composerSubmit.sendTooltip}
          stopTooltip={CHAT_COPY.composerSubmit.cancelTooltip}
        />
      </PromptInputFooter>
    </PromptInput>
  );
}
