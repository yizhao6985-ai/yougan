import { ImageIcon, MusicIcon, VideoIcon } from "lucide-react";
import { useRef, useState } from "react";

import { PromptInputButton } from "@/components/ai-elements/prompt-input";
import { useComposerAttachmentsContext } from "@/components/studio/composer-attachments-context";
import { useYouganStreamContext } from "@/components/studio/yougan-stream-provider";
import { CHAT_COPY } from "@/lib/site-copy";

type UploadKind = "image" | "audio" | "video";

const ACCEPT: Record<UploadKind, string> = {
  image: "image/jpeg,image/png,image/webp,image/gif",
  audio: "audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/aac,.mp3,.wav,.ogg,.m4a",
  video: "video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov",
};

function UploadKindButton({
  kind,
  icon: Icon,
  disabled,
  tooltip,
  onPick,
}: {
  kind: UploadKind;
  icon: typeof ImageIcon;
  disabled: boolean;
  tooltip: string;
  onPick: (files: FileList) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [picking, setPicking] = useState(false);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT[kind]}
        multiple
        className="hidden"
        onChange={async (event) => {
          const files = event.target.files;
          if (!files?.length) return;
          setPicking(true);
          try {
            await onPick(files);
          } finally {
            setPicking(false);
            if (inputRef.current) inputRef.current.value = "";
          }
        }}
      />
      <PromptInputButton
        disabled={disabled || picking}
        tooltip={picking ? CHAT_COPY.attachmentDrawer.uploading : tooltip}
        onClick={() => inputRef.current?.click()}
      >
        <Icon className="size-4" />
      </PromptInputButton>
    </>
  );
}

export function UploadReferenceButtons() {
  const { canChat } = useYouganStreamContext();
  const { addFiles, hasUploading, canAddMore } = useComposerAttachmentsContext();

  const disabled = !canChat || hasUploading || !canAddMore;
  const maxReached = !canAddMore;

  const tooltipFor = (kind: UploadKind) => {
    if (maxReached) return CHAT_COPY.attachmentDrawer.maxReached;
    if (hasUploading) return CHAT_COPY.attachmentDrawer.uploading;
    return CHAT_COPY.attachmentDrawer.uploadTooltips[kind];
  };

  const handlePick = async (files: FileList) => {
    await addFiles(files);
  };

  return (
    <>
      <UploadKindButton
        kind="image"
        icon={ImageIcon}
        disabled={disabled}
        tooltip={tooltipFor("image")}
        onPick={handlePick}
      />
      <UploadKindButton
        kind="audio"
        icon={MusicIcon}
        disabled={disabled}
        tooltip={tooltipFor("audio")}
        onPick={handlePick}
      />
      <UploadKindButton
        kind="video"
        icon={VideoIcon}
        disabled={disabled}
        tooltip={tooltipFor("video")}
        onPick={handlePick}
      />
    </>
  );
}

/** @deprecated 使用 UploadReferenceButtons */
export const UploadReferenceButton = UploadReferenceButtons;
