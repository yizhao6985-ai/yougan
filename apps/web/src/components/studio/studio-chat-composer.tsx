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
import { UploadReferenceButton } from "@/components/studio/upload-reference-button";
import { useYouganStreamContext } from "@/components/studio/yougan-stream-provider";
import { scene } from "@/lib/scene-styles";
import { CHAT_COPY } from "@/lib/site-copy";
import type { TurnQueueKind } from "@/lib/types";

type StudioChatComposerProps = {
  activeTurnKind?: TurnQueueKind;
  input: string;
  onInputChange: (value: string) => void;
  onSend: (payload: { text: string; imageUrls: string[] }) => void | Promise<void>;
  chatStatus: "ready" | "submitted" | "streaming" | "error";
};

export function StudioChatComposer({
  activeTurnKind,
  input,
  onInputChange,
  onSend,
  chatStatus,
}: StudioChatComposerProps) {
  const { stream, modelTemperatureLevel, setModelTemperatureLevel } =
    useYouganStreamContext();
  const {
    clear,
    readyUrls,
    hasReady,
    hasUploading,
  } = useComposerAttachmentsContext();

  const handleSubmit = useCallback(
    async (message: { text: string }) => {
      const urls = readyUrls();
      const trimmed = message.text.trim();
      if ((!trimmed && urls.length === 0) || stream.isLoading || hasUploading) {
        return;
      }
      onInputChange("");
      clear();
      await onSend({ text: trimmed, imageUrls: urls });
    },
    [clear, hasUploading, onInputChange, onSend, readyUrls, stream.isLoading],
  );

  const canSubmit =
    (Boolean(input.trim()) || hasReady) && !stream.isLoading && !hasUploading;

  return (
    <PromptInput
      className={scene.composerFloatingInput}
      onSubmit={(message) => void handleSubmit(message)}
    >
      <ComposerAttachmentDrawer />
      <PromptInputBody>
        <PromptInputTextarea
          placeholder={CHAT_COPY.placeholder}
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
        />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputTools className="flex-wrap gap-2">
          <UploadReferenceButton />
          {activeTurnKind === "creation" ? (
            <ModelTemperatureControl
              level={modelTemperatureLevel}
              onChange={setModelTemperatureLevel}
              disabled={stream.isLoading}
            />
          ) : null}
        </PromptInputTools>
        <PromptInputSubmit disabled={!canSubmit} status={chatStatus} />
      </PromptInputFooter>
    </PromptInput>
  );
}
