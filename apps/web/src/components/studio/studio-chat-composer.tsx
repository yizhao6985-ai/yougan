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
import {
  ChatModeSwitcher,
} from "@/components/studio/chat-mode-switcher";
import { ModelTemperatureControl } from "@/components/studio/model-temperature-control";
import { UploadReferenceButton } from "@/components/studio/upload-reference-button";
import { useYouganStreamContext } from "@/components/studio/yougan-stream-provider";
import { modeShortcutLabel } from "@/lib/chat-mode-config";
import { scene } from "@/lib/scene-styles";
import { CHAT_COPY } from "@/lib/site-copy";
import type { ChatMode } from "@/lib/types";

type StudioChatComposerProps = {
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  input: string;
  onInputChange: (value: string) => void;
  onSend: (payload: { text: string; imageUrls: string[] }) => void | Promise<void>;
  chatStatus: "ready" | "submitted" | "streaming" | "error";
};

export function StudioChatComposer({
  mode,
  onModeChange,
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
    <>
      <PromptInput
        className={scene.composerFloatingInput}
        onSubmit={(message) => void handleSubmit(message)}
      >
        <ComposerAttachmentDrawer />
        <PromptInputBody>
          <PromptInputTextarea
            placeholder={CHAT_COPY.placeholders[mode]}
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
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
              onChange={onModeChange}
              disabled={stream.isLoading}
            />
          </PromptInputTools>
          <PromptInputSubmit disabled={!canSubmit} status={chatStatus} />
        </PromptInputFooter>
      </PromptInput>
      <p className="mt-2 text-center text-[11px] text-muted-foreground/70">
        {CHAT_COPY.modeShortcutsFooter({
          inspiration: modeShortcutLabel("inspiration"),
          outline: modeShortcutLabel("outline"),
          creation: modeShortcutLabel("creation"),
        })}
      </p>
    </>
  );
}
