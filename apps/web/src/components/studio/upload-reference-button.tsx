import { ImageIcon } from "lucide-react";
import { useRef, useState } from "react";

import { PromptInputButton } from "@/components/ai-elements/prompt-input";
import { useComposerAttachmentsContext } from "@/components/studio/composer-attachments-context";
import { useYouganStreamContext } from "@/components/studio/yougan-stream-provider";
import { CHAT_COPY } from "@/lib/site-copy";

export function UploadReferenceButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [picking, setPicking] = useState(false);
  const { canChat } = useYouganStreamContext();
  const { addFiles, hasUploading, canAddMore } = useComposerAttachmentsContext();

  const disabled = !canChat || hasUploading || !canAddMore || picking;

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={async (event) => {
          const files = event.target.files;
          if (!files?.length) return;
          setPicking(true);
          try {
            await addFiles(files);
          } finally {
            setPicking(false);
            if (inputRef.current) inputRef.current.value = "";
          }
        }}
      />
      <PromptInputButton
        disabled={disabled}
        tooltip={
          !canAddMore
            ? CHAT_COPY.attachmentDrawer.maxReached
            : hasUploading || picking
              ? CHAT_COPY.attachmentDrawer.uploading
              : CHAT_COPY.attachmentDrawer.uploadTooltip
        }
        onClick={() => inputRef.current?.click()}
      >
        <ImageIcon className="size-4" />
      </PromptInputButton>
    </>
  );
}
