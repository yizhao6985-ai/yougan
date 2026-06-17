/** 进入 production 子图前：interrupt 等待用户确认（耗时可能较长） */
import { interrupt } from "@langchain/langgraph";
import {
  PRODUCTION_CONFIRM_INTERRUPT_KIND,
  type ProductionConfirmDecision,
  type ProductionConfirmInterruptValue,
} from "@yougan/domain";

import { getActiveTurnKind, patchTurn } from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

const PRODUCTION_CONFIRM_PAYLOAD: ProductionConfirmInterruptValue = {
  kind: PRODUCTION_CONFIRM_INTERRUPT_KIND,
  title: "开始创作",
  message:
    "方案已就绪，即将进入制作环节。AI 团队会按计划执行各项任务，过程可能需要几分钟。确认开始吗？",
};

export async function confirmProductionTurnNode(
  state: AgentStateType,
): Promise<AgentStatePatch> {
  if (getActiveTurnKind(state) !== "production") return {};

  const decision = interrupt<
    ProductionConfirmInterruptValue,
    ProductionConfirmDecision
  >(PRODUCTION_CONFIRM_PAYLOAD);

  return patchTurn(state, { productionConfirm: decision });
}
