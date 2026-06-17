/** 制作任务交付物校验 */
import type {
  ProductionTask,
  ProductionTaskDeliverable,
} from "@yougan/domain";

const MIN_BODY_LENGTH = 20;

const FAILURE_MARKERS = [
  "任务执行失败，请重试。",
  "文案生成失败，请重试。",
  "暂时无法完成该任务，请稍后重试。",
  "设计任务执行失败，请重试。",
] as const;

export function isPlaceholderDeliverableText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  return FAILURE_MARKERS.some((marker) => trimmed.includes(marker));
}

export function isValidTaskDeliverable(
  deliverable: ProductionTaskDeliverable | null | undefined,
  task?: ProductionTask,
): boolean {
  const body = deliverable?.body?.trim() ?? "";
  if (body.length < MIN_BODY_LENGTH) return false;
  if (isPlaceholderDeliverableText(body)) return false;

  if (task?.department === "design") {
    return Boolean(deliverable?.images?.[0]?.url?.trim());
  }

  return true;
}

export function isValidDesignPromptDeliverable(
  deliverable: ProductionTaskDeliverable | null | undefined,
): boolean {
  const body = deliverable?.body?.trim() ?? "";
  if (body.length < MIN_BODY_LENGTH) return false;
  return !isPlaceholderDeliverableText(body);
}
