/** 参考素材展示用：过滤无效摘要（如 String(object) 产生的脏数据）。 */
export function referenceDisplayText(value: unknown): string | null {
  if (value == null) return null;

  const text =
    typeof value === "string"
      ? value
      : Array.isArray(value)
        ? value
            .map((part) =>
              typeof part === "string"
                ? part
                : part && typeof part === "object" && "text" in part
                  ? String((part as { text?: unknown }).text ?? "")
                  : "",
            )
            .join("")
        : "";

  const trimmed = text.trim();
  if (!trimmed || trimmed.includes("[object Object]")) return null;
  return trimmed;
}

export function referenceChipLabel(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed && !trimmed.includes("[object Object]") ? trimmed : null;
  }
  return null;
}
