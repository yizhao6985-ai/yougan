/** LangGraph interrupt 载荷：进入 production 前需用户确认 */
export const PRODUCTION_CONFIRM_INTERRUPT_KIND =
  "production_confirm" as const;

export type ProductionConfirmInterruptKind =
  typeof PRODUCTION_CONFIRM_INTERRUPT_KIND;

export type ProductionConfirmInterruptValue = {
  kind: ProductionConfirmInterruptKind;
  title: string;
  message: string;
};

export type ProductionConfirmDecision = "confirm" | "decline";

export const REVISE_CONFIRM_INTERRUPT_KIND = "revise_confirm" as const;

export type ReviseConfirmInterruptKind = typeof REVISE_CONFIRM_INTERRUPT_KIND;

export type ReviseConfirmInterruptValue = {
  kind: ReviseConfirmInterruptKind;
  title: string;
  message: string;
  itemCount: number;
};

export type ReviseConfirmDecision = "confirm" | "decline";
