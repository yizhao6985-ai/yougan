/** 制作任务交付物结构校验（仅非空；内容质量由 accept 节点 LLM 验收） */
import type {
  ProductionTask,
  ProductionTaskDeliverable,
} from "@yougan/domain";

export function isValidTaskDeliverable(
  deliverable: ProductionTaskDeliverable | null | undefined,
  _task?: ProductionTask,
): boolean {
  return Boolean(deliverable?.body?.trim());
}
