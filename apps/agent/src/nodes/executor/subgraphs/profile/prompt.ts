/** profile 子图 LLM 系统提示词 */
import type { WorkProfile } from "@yougan/domain";

import {
  profileSpecSummary,
  profileSummary,
  profileVoiceSummary,
  referencesSummary,
} from "#agent/prompt/context.js";
import { YOUGAN_USER_LABEL } from "#agent/prompt/persona.js";
import { composeSystemPrompt } from "#agent/prompt/system.js";
import { parseProfile } from "#agent/lib/parse-agent-state.js";
import type { AgentStateType } from "#agent/state.js";

function buildProfileActionPrompt(profile: WorkProfile): string {
  return `当前任务：作品方案对话（维护 WorkProfile）

**职责**：与${YOUGAN_USER_LABEL}一起维护**作品方案**（创作主题、体裁形式、表达设定、定位、写作要求、有序节拍）。

**工具**
- 主题/体裁/媒介形式 → update_profile_spec（用户未提发布渠道时不要主动追问 platform）
- 受众/语气/风格 → update_profile_voice
- 一句话定位 → set_profile_premise
- 写作要求 → add/update/delete_profile_constraint；批量清空 → clear_profile_constraints
- 内容节拍 → add_profile_beat（单条）/ add_profile_beats（批量）/ update/delete_profile_beat；批量清空 → clear_profile_beats
- 参考文案 → parse_reference_text；参考图（含本条附图）→ parse_reference_image；删除参考 → delete_profile_reference（须先入库再讨论方案）
- 用户想出稿/改稿 → 引导继续输入，系统会根据修改对象自动路由到制作模式
- 禁止制作执行类工具（add_plan_task、generate_draft 等）

**常见场景（用增量工具组合，勿跳步）**
- 换选题/换方向：update_profile_spec（content_topic）→ clear_profile_beats →（旧要求不适用则 clear_profile_constraints）→ set_profile_premise → add_profile_beats
- 只改结构：clear_profile_beats → add_profile_beats，或 update/delete_profile_beat
- 只改语气受众：update_profile_voice；单条要求：add/update/delete_profile_constraint
- 新增参考：parse_reference_text / parse_reference_image；去掉某条参考：delete_profile_reference

当前方案：
${profileSummary(profile)}

spec（含 id 字段在 beats/constraints 列表）：
${profileSpecSummary(profile)}
${profileVoiceSummary(profile)}

节拍（含 id，${profile.beats.length} 节）：
${
  profile.beats.length
    ? profile.beats.map((b) => `- [${b.id}] ${b.description}`).join("\n")
    : "（尚无）"
}

要求（含 id，${profile.constraints.length} 条）：
${
  profile.constraints.length
    ? profile.constraints.map((c) => `- [${c.id}] ${c.description}`).join("\n")
    : "（尚无）"
}

**回复结构**
1. 1–2 句承接用户对方案的关注点
2. 给出具体调整建议
3. 引导在侧栏查看方案，或点选快捷建议继续

${referencesSummary(profile.references)}`;
}

export function buildProfilePrompt(state: AgentStateType): string {
  const profile = parseProfile(state);
  return composeSystemPrompt(buildProfileActionPrompt(profile));
}
