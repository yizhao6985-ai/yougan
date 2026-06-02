/** 按字素切分，用于中文等场景的打字机效果 */
export function segmentGraphemes(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter("zh", { granularity: "grapheme" });
    return [...segmenter.segment(text)].map((part) => part.segment);
  }
  return [...text];
}
