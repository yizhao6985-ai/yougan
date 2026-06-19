import type { Interrupt, ThreadState } from "@langchain/langgraph-sdk";
import {
  PRODUCTION_CONFIRM_INTERRUPT_KIND,
  type ProductionConfirmInterruptValue,
} from "@yougan/domain";

function isProductionConfirmPayload(
  value: unknown,
): value is ProductionConfirmInterruptValue {
  return (
    value != null &&
    typeof value === "object" &&
    "kind" in value &&
    value.kind === PRODUCTION_CONFIRM_INTERRUPT_KIND
  );
}

function asInterruptList(
  interrupt: Interrupt | Interrupt[] | undefined,
): Interrupt[] {
  if (interrupt == null) return [];
  return Array.isArray(interrupt) ? interrupt : [interrupt];
}

/** thread 上是否仍有 production 制作前确认 interrupt（含 run 已结束、等待用户点按钮） */
export function hasProductionConfirmInterrupt(
  interrupt: Interrupt | Interrupt[] | undefined,
  persisted?: ProductionConfirmInterruptValue | null,
): boolean {
  return resolveProductionConfirmInterrupt(interrupt, persisted) != null;
}

export function getProductionConfirmInterrupt(
  interrupt: Interrupt | Interrupt[] | undefined,
): ProductionConfirmInterruptValue | null {
  return resolveProductionConfirmInterrupt(interrupt, null);
}

/** 从 getState 的 tasks 恢复制作前确认 interrupt（刷新后 stream.interrupt 可能尚未就绪） */
export function getProductionConfirmInterruptFromThreadState(
  state: Pick<ThreadState, "tasks"> | null | undefined,
): ProductionConfirmInterruptValue | null {
  for (const task of state?.tasks ?? []) {
    for (const item of task.interrupts ?? []) {
      if (isProductionConfirmPayload(item.value)) return item.value;
    }
  }
  return null;
}

/** stream.interrupt 与 getState 兜底合并 */
export function resolveProductionConfirmInterrupt(
  interrupt: Interrupt | Interrupt[] | undefined,
  persisted: ProductionConfirmInterruptValue | null | undefined,
): ProductionConfirmInterruptValue | null {
  for (const item of asInterruptList(interrupt)) {
    if (isProductionConfirmPayload(item.value)) return item.value;
  }
  return persisted ?? null;
}
