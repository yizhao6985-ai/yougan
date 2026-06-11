/** OpenAI 兼容多模态 image_url content block */
export function referenceImagePartFromBuffer(
  frame: Buffer,
  mimeType = "image/jpeg",
) {
  return {
    type: "image_url" as const,
    image_url: {
      url: `data:${mimeType};base64,${frame.toString("base64")}`,
    },
  };
}
