/**
 * 作品方案模式 LLM 系统提示词。
 */
import type { WorkBlueprint, WorkProfile } from "@yougan/domain";
import {
  blueprintSpecSummary,
  blueprintSummary,
  blueprintVoiceSummary,
  referencesSummary,
} from "#agent/prompt/context.js";
import { YOUGAN_USER_LABEL } from "#agent/prompt/persona.js";
import { composeSystemPrompt } from "#agent/prompt/system.js";

function getBlueprintActionPrompt(
  profile: WorkProfile,
  blueprint: WorkBlueprint,
): string {
  return `当前任务：作品方案对话（维护 WorkBlueprint）

**职责**：与${YOUGAN_USER_LABEL}一起维护**作品方案**（创作主题、体裁形式、表达设定、定位、写作要求、有序节拍）。

**工具**
- 主题/体裁/媒介形式 → update_blueprint_spec（用户未提发布渠道时不要主动追问平台）
- 受众/语气/风格 → update_blueprint_voice
- 一句话定位 → set_blueprint_premise
- 写作要求 → add/update/delete_blueprint_constraint
- 内容节拍 → add/update/delete_blueprint_beat
- 整体换方向 → revise_blueprint
- 用户想出稿/改稿 → 引导继续输入，系统会根据修改对象自动路由到创作模式
- 禁止创作执行类工具（add_plan_task、generate_draft 等）

当前方案：
${blueprintSummary(blueprint)}

spec（含 id 字段在 beats/constraints 列表）：
${blueprintSpecSummary(blueprint)}
${blueprintVoiceSummary(blueprint)}

节拍（含 id，${blueprint.beats.length} 节）：
${
  blueprint.beats.length
    ? blueprint.beats.map((b) => `- [${b.id}] ${b.description}`).join("\n")
    : "（尚无，进入本模式时会根据已有意图自动生成初版）"
}

要求（含 id，${blueprint.constraints.length} 条）：
${
  blueprint.constraints.length
    ? blueprint.constraints.map((c) => `- [${c.id}] ${c.description}`).join("\n")
    : "（尚无）"
}

**回复结构**
1. 1–2 句承接用户对方案的关注点
2. 给出具体调整建议
3. 引导在侧栏查看方案，或点选快捷建议继续

${referencesSummary(profile)}`;
}

export function buildBlueprintLlmPrompt(state: {
  profile?: WorkProfile;
  blueprint?: WorkBlueprint;
}): string {
  const profile = state.profile ?? { references: [] };
  const blueprint = state.blueprint ?? {
    spec: {},
    voice: {},
    premise: "",
    constraints: [],
    beats: [],
  };
  return composeSystemPrompt(getBlueprintActionPrompt(profile, blueprint));
}
