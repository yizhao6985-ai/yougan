import { useCallback, useEffect, useRef, useState } from "react";
import { inferMediaKind, type MediaKind } from "@yougan/domain";
import { nanoid } from "nanoid";

import type { HumanAttachmentAsset } from "@yougan/domain";
import { resolveReferenceAssetUrl } from "@/lib/reference-asset-url";
import { uploadReference } from "@/services/works";

export type ComposerAttachmentStatus = "uploading" | "ready" | "error";

export type ComposerAttachment = {
  id: string;
  previewUrl: string;
  filename: string;
  mimeType: string;
  mediaKind: MediaKind;
  url?: string;
  key?: string;
  status: ComposerAttachmentStatus;
  error?: string;
};

const MAX_ATTACHMENTS = 6;

function inferMediaKindFromFile(file: File): MediaKind {
  if (file.type) return inferMediaKind(file.type);
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "mp3" || ext === "wav" || ext === "ogg" || ext === "m4a") {
    return "audio";
  }
  if (ext === "mp4" || ext === "webm" || ext === "mov" || ext === "m4v") {
    return "video";
  }
  if (ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp" || ext === "gif") {
    return "image";
  }
  return "file";
}

export function useComposerAttachments() {
  const [items, setItems] = useState<ComposerAttachment[]>([]);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    return () => {
      for (const item of itemsRef.current) {
        if (item.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(item.previewUrl);
        }
      }
    };
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const clear = useCallback(() => {
    setItems((prev) => {
      for (const item of prev) {
        if (item.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(item.previewUrl);
        }
      }
      return [];
    });
  }, []);

  const addFiles = useCallback(async (files: File[] | FileList) => {
    const incoming = [...files];
    if (incoming.length === 0) return;

    const available = MAX_ATTACHMENTS - itemsRef.current.length;
    if (available <= 0) return;

    const batch = incoming.slice(0, available);

    for (const file of batch) {
      const id = nanoid();
      const previewUrl = URL.createObjectURL(file);
      const mediaKind = inferMediaKindFromFile(file);
      setItems((prev) => [
        ...prev,
        {
          id,
          previewUrl,
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          mediaKind,
          status: "uploading",
        },
      ]);

      try {
        const asset = await uploadReference(file);
        const url = resolveReferenceAssetUrl(asset.url) ?? asset.url;
        setItems((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  url,
                  key: asset.key,
                  mimeType: asset.mime_type || item.mimeType,
                  mediaKind: inferMediaKind(
                    asset.mime_type || item.mimeType,
                  ),
                  filename: asset.original_name || item.filename,
                  status: "ready",
                  error: undefined,
                }
              : item,
          ),
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "上传失败，请重试";
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: "error", error: message } : item,
          ),
        );
      }
    }
  }, []);

  const readyAttachments = useCallback((): HumanAttachmentAsset[] => {
    return items
      .filter((item) => item.status === "ready" && item.url)
      .map((item) => ({
        url: item.url!,
        mime_type: item.mimeType,
        original_name: item.filename,
      }));
  }, [items]);

  const hasUploading = items.some((item) => item.status === "uploading");
  const hasReady = items.some((item) => item.status === "ready");
  const canAddMore = items.length < MAX_ATTACHMENTS;

  return {
    items,
    addFiles,
    remove,
    clear,
    readyAttachments,
    hasUploading,
    hasReady,
    canAddMore,
    maxAttachments: MAX_ATTACHMENTS,
  };
}

export type ComposerAttachmentsStore = ReturnType<typeof useComposerAttachments>;
