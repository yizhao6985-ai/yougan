import type { MediaKind } from "@yougan/domain";

export type PreprocessableKind = "text" | "image" | "audio";

const REFERENCE_PREPROCESS_KIND: Record<MediaKind, PreprocessableKind | null> =
  {
    text: "text",
    image: "image",
    audio: "audio",
    video: null,
    file: "text",
  };

export function preprocessExpectedKind(
  mediaKind: MediaKind,
): PreprocessableKind | null {
  return REFERENCE_PREPROCESS_KIND[mediaKind] ?? null;
}

export function isSupportedReferencePreprocessKind(
  mediaKind: MediaKind,
): boolean {
  return preprocessExpectedKind(mediaKind) !== null;
}
