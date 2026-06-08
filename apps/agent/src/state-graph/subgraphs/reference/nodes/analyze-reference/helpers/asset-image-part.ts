import type { HumanImageBase64ContentPart } from "@yougan/domain";

export function referenceImagePartFromBuffer(
  frame: Buffer,
  mimeType = "image/jpeg",
): HumanImageBase64ContentPart {
  return {
    type: "image",
    source_type: "base64",
    mime_type: mimeType,
    data: frame.toString("base64"),
  };
}
