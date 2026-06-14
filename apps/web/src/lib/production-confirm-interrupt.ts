import type { Interrupt } from "@langchain/langgraph-sdk";
import {
  PRODUCTION_CONFIRM_INTERRUPT_KIND,
  type ProductionConfirmInterruptValue,
} from "@yougan/domain";

function asInterruptList(
  interrupt: Interrupt | Interrupt[] | undefined,
): Interrupt[] {
  if (interrupt == null) return [];
  return Array.isArray(interrupt) ? interrupt : [interrupt];
}

export function getProductionConfirmInterrupt(
  interrupt: Interrupt | Interrupt[] | undefined,
): ProductionConfirmInterruptValue | null {
  for (const item of asInterruptList(interrupt)) {
    const value = item.value;
    if (
      value != null &&
      typeof value === "object" &&
      "kind" in value &&
      value.kind === PRODUCTION_CONFIRM_INTERRUPT_KIND
    ) {
      return value as ProductionConfirmInterruptValue;
    }
  }
  return null;
}
