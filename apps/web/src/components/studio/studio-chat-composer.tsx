import { useCallback } from "react";

import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { ComposerAttachmentDrawer } from "@/components/studio/composer-attachment-drawer";
import { useComposerAttachmentsContext } from "@/components/studio/composer-attachments-context";
import { ModelTemperatureControl } from "@/components/studio/model-temperature-control";
import { UploadReferenceButtons } from "@/components/studio/upload-reference-button";
import { useYouganStreamContext } from "@/components/studio/yougan-stream-provider";
import { scene } from "@/lib/scene-styles";
import type { HumanAttachmentAsset } from "@yougan/domain";
import { CHAT_COPY } from "@/lib/site-copy";

type StudioChatComposerProps = {
  input: string;
  onInputChange: (value: string) => void;
  onSend: (payload: {
    text: string;
    attachments: HumanAttachmentAsset[];
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
    stream,
    canSend,
    modelTemperatureLevel,
    setModelTemperatureLevel,
  } = useYouganStreamContext();
  const {
    clear,
    readyAttachments,
    hasReady,
    hasUploading,
  } = useComposerAttachmentsContext();

  const handleSubmit = useCallback(
    async (message: { text: string }) => {
      const attachments = readyAttachments();
      const trimmed = message.text.trim();
      if (
        (!trimmed && attachments.length === 0) ||
        !canSend ||
        hasUploading
      ) {
        return;
      }
      onInputChange("");
      clear();
      await onSend({ text: trimmed, attachments });
    },
    [canSend, clear, hasUploading, onInputChange, onSend, readyAttachments],
  );

  const canSubmit =
    (Boolean(input.trim()) || hasReady) && canSend && !hasUploading;

  return (
    <PromptInput
      className={scene.composerFloatingInput}
      onSubmit={(message) => void handleSubmit(message)}
    >
      <ComposerAttachmentDrawer />
      <PromptInputBody>
        <PromptInputTextarea
          placeholder={placeholder ?? CHAT_COPY.placeholderDefault}
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
        />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputTools className="flex-wrap gap-2">
          <UploadReferenceButtons />
          <ModelTemperatureControl
            level={modelTemperatureLevel}
            onChange={setModelTemperatureLevel}
          />
        </PromptInputTools>
        <PromptInputSubmit
          disabled={!canSubmit && chatStatus !== "streaming"}
          status={chatStatus}
          onStop={() => void onStop?.()}
        />
      </PromptInputFooter>
    </PromptInput>
  );
}
