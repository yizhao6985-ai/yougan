import { HumanMessage } from "@langchain/core/messages";

import { createStructuredModel } from "#agent/llm/dashscope.js";
import { invokeStructuredOutput } from "../structured-output.js";
import { profileSummary } from "#agent/prompt/context.js";
import { resolveIndustryContext } from "../industry-prompts.js";
import { newProfileBeat, type WorkProfile } from "@yougan/domain";
import { parseProfile } from "../parse-agent-state.js";
import type { AgentStateType } from "#agent/state.js";
import { ProfileResponseSchema } from "./response-schema.js";
import { profileToContentSpec } from "./content-profile.js";

/** 整体换方向时全量重做 profile beats */
export async function reviseProfileFull(
  state: AgentStateType,
  reason: string,
): Promise<Partial<AgentStateType>> {
  const existing = parseProfile(state);
  const spec = profileToContentSpec(existing);
  const industry = resolveIndustryContext(spec);
  const llm = createStructuredModel({ temperature: 0.5 });

  const prompt = `你是作品方案策划，请根据新要求重新制定作品方案结构。

调整原因：${reason.trim() || "用户新要求"}

${profileSummary(existing)}
行业：${industry}

输出 premise + 3–8 个有序 beats，不要部门分工。`;

  try {
    const parsed = await invokeStructuredOutput(
      llm,
      ProfileResponseSchema,
      [new HumanMessage(prompt)],
      { name: "profile_full_revise" },
    );
    const profile: WorkProfile = {
      ...existing,
      premise: parsed.premise.trim(),
      beats: parsed.beats.map((b) => newProfileBeat(b.description, b.intent)),
    };
    return { profile } as Partial<AgentStateType>;
  } catch {
    return {};
  }
}
