import { HumanMessage } from "@langchain/core/messages";

import { newOutlineSection, type WorkOutline } from "@yougan/domain";

import { createStructuredModel } from "#agent/llm/dashscope.js";
import { invokeStructuredOutput } from "../structured-output.js";
import {
  briefSummary,
  profileSummary,
} from "#agent/prompt/context.js";
import { resolveIndustryContext } from "../industry-prompts.js";
import { resolveContentSpec } from "../content-spec.js";
import {
  parseBrief,
  parseOutline,
  parseProfile,
} from "../parse-agent-state.js";
import type { AgentStateType } from "#agent/state.js";
import { OutlineResponseSchema } from "./response-schema.js";

/** 整体换方向时全量重做大纲（outline 子图 revise_outline 工具） */
export async function reviseOutlineFull(
  state: AgentStateType,
  reason: string,
): Promise<Partial<AgentStateType>> {
  const brief = parseBrief(state);
  if (!brief.requirements.length) return {};

  const profile = resolveContentSpec(parseProfile(state));
  const industry = resolveIndustryContext(profile);
  const existing = parseOutline(state);
  const llm = createStructuredModel({ temperature: 0.5 });

  const prompt = `你是内容大纲策划，请根据新要求重新制定内容结构大纲。

调整原因：${reason.trim() || "用户新要求"}

${briefSummary(brief)}
${profileSummary(profile)}
行业：${industry}

输出 3–8 条内容结构条目，不要部门分工。`;

  try {
    const parsed = await invokeStructuredOutput(
      llm,
      OutlineResponseSchema,
      [new HumanMessage(prompt)],
      { name: "outline_full_revise" },
    );
    const outline: WorkOutline = {
      ...existing,
      sections: parsed.sections.map((s) => newOutlineSection(s.description)),
      summary: parsed.summary,
    };
    return { outline };
  } catch {
    return {};
  }
}
