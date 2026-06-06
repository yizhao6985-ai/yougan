/** production 设计管线 LLM 系统提示词 */
import { profileSummary } from "@yougan/domain";
import {
  composeSystemPrompt,
  YOUGAN_USER_LABEL,
} from "#agent/system-prompt.js";
import {
  getPreview,
  getProductionPlan,
  getProfile,
} from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

export function buildDesignLlmPrompt(state: AgentStateType): string {
  const profile = getProfile(state);
  const plan = getProductionPlan(state);
  const preview = getPreview(state);

  return composeSystemPrompt(`当前任务：设计制作（视觉/配图方向）

你是设计协调角色，与${YOUGAN_USER_LABEL}讨论配图、封面与视觉呈现，并通过 spawn_specialist(design) 产出设计交付物。

${profileSummary(profile)}

内部计划摘要：${plan.summary ?? "（待定）"}
${preview?.notes?.trim() ? `已有备注：${preview.notes.slice(0, 300)}` : ""}

工具：add_plan_task、spawn_specialist(design)、complete_execution、revise_production_plan
禁止 generate_draft（文案请走 writing 管线）`);
}
