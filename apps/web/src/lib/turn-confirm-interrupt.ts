import type { Interrupt } from "@langchain/langgraph-sdk";
import type {
  ProductionConfirmInterruptValue,
  ReviseConfirmInterruptValue,
} from "@yougan/domain";

import {
  hasProductionConfirmInterrupt,
  resolveProductionConfirmInterrupt,
} from "@/lib/production-confirm-interrupt";
import {
  hasReviseConfirmInterrupt,
  resolveReviseConfirmInterrupt,
} from "@/lib/revise-confirm-interrupt";

export function hasTurnConfirmInterrupt(
  interrupt: Interrupt | Interrupt[] | undefined,
  persistedProduction?: ProductionConfirmInterruptValue | null,
  persistedRevise?: ReviseConfirmInterruptValue | null,
): boolean {
  return (
    hasProductionConfirmInterrupt(interrupt, persistedProduction) ||
    hasReviseConfirmInterrupt(interrupt, persistedRevise)
  );
}

export function resolveActiveTurnConfirmInterrupt(
  interrupt: Interrupt | Interrupt[] | undefined,
  persistedProduction?: ProductionConfirmInterruptValue | null,
  persistedRevise?: ReviseConfirmInterruptValue | null,
):
  | { kind: "production"; value: ProductionConfirmInterruptValue }
  | { kind: "revise"; value: ReviseConfirmInterruptValue }
  | null {
  const production = resolveProductionConfirmInterrupt(
    interrupt,
    persistedProduction,
  );
  if (production) return { kind: "production", value: production };
  const revise = resolveReviseConfirmInterrupt(interrupt, persistedRevise);
  if (revise) return { kind: "revise", value: revise };
  return null;
}
