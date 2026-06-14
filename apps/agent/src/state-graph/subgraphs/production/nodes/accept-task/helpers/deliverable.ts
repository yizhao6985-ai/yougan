/** 制作任务交付物校验 */
import type { ProductionTaskDeliverable } from "@yougan/domain";

const MIN_BODY_LENGTH = 20;

const FAILURE_MARKERS = [
  "任务执行失败，请重试。",
  "文案生成失败，请重试。",
  "暂时无法完成该任务，请稍后重试。",
] as const;

export function isPlaceholderDeliverableText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  return FAILURE_MARKERS.some((marker) => trimmed.includes(marker));
}

export function isValidTaskDeliverable(
  deliverable: ProductionTaskDeliverable | null | undefined,
): boolean {
  const body = deliverable?.body?.trim() ?? "";
  if (body.length < MIN_BODY_LENGTH) return false;
  return !isPlaceholderDeliverableText(body);
}
