import { ImageIcon } from "lucide-react";
import { useRef, useState } from "react";

import { PromptInputButton } from "@/components/ai-elements/prompt-input";
import { useYouganStreamContext } from "@/components/studio/yougan-stream-provider";
import { uploadReference } from "@/services/works";

export function UploadReferenceButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { sendMessage, canChat } = useYouganStreamContext();

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          setUploading(true);
          try {
            const data = await uploadReference(file);
            await sendMessage(`我上传了参考图片，请解析：${data.url}`);
          } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = "";
          }
        }}
      />
      <PromptInputButton
        disabled={!canChat || uploading}
        tooltip={uploading ? "上传中..." : "上传参考图"}
        onClick={() => inputRef.current?.click()}
      >
        <ImageIcon className="size-4" />
      </PromptInputButton>
    </>
  );
}
