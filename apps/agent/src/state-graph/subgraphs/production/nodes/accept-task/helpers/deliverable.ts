/** 制作任务交付物结构校验（仅非空；内容质量由 accept 节点 LLM 验收） */
import type {
  ProductionTask,
  ProductionTaskDeliverable,
} from "@yougan/domain";

export function isValidTaskDeliverable(
  deliverable: ProductionTaskDeliverable | null | undefined,
  task?: ProductionTask,
): boolean {
  if (task?.department === "design") {
    const body = deliverable?.body?.trim() ?? "";
    if (!body) return false;
    return Boolean(deliverable?.images?.[0]?.url?.trim());
  }

  if (task?.department === "audio") {
    const url = deliverable?.body?.trim() ?? "";
    if (!url) return false;
    return Boolean(deliverable?.notes?.trim());
  }

  return Boolean(deliverable?.body?.trim());
}

/** 设计任务：文生图 prompt 已写入（尚未或无需成图） */
export function isValidDesignPromptDeliverable(
  deliverable: ProductionTaskDeliverable | null | undefined,
): boolean {
  return Boolean(deliverable?.body?.trim());
}
