/**
 * brief 已有、大纲为空时，在进入大纲对话前生成初版结构。
 */
import { HumanMessage } from "@langchain/core/messages";

import { createStructuredModel } from "../../llm/dashscope.js";
import { invokeStructuredOutput } from "../structured-output.js";
import {
  briefSummary,
  profileSummary,
} from "../../prompt/context.js";
import { YOUGAN_USER_LABEL } from "../../prompt/persona.js";
import { resolveIndustryContext } from "../industry-prompts.js";
import { resolveContentSpec } from "../content-spec.js";
import {
  hasBriefContent,
  hasOutlineContent,
  newOutlineSection,
  type WorkOutline,
} from "../../schema.js";
import {
  parseBrief,
  parseOutline,
  parseProfile,
} from "../parse-agent-state.js";
import type { AgentStateType } from "../../state.js";
import { OutlineResponseSchema } from "./response-schema.js";

export function shouldBootstrapOutlineFromBrief(
  state: AgentStateType,
): boolean {
  const brief = parseBrief(state);
  if (!hasBriefContent(brief)) return false;
  const outline = parseOutline(state);
  if (hasOutlineContent(outline)) return false;
  return true;
}

function buildBootstrapOutlinePrompt(state: AgentStateType): string {
  const profile = resolveContentSpec(parseProfile(state));
  const brief = parseBrief(state);
  const industry = resolveIndustryContext(profile);

  return `你是内容大纲策划（内部角色，不对${YOUGAN_USER_LABEL}直接说话），根据当前 brief 制定**内容结构大纲**。

${YOUGAN_USER_LABEL}当前的创作需求：
${briefSummary(brief)}

作品特征：
${profileSummary(profile)}

行业经验：
${industry}

请输出内容大纲：
1. 条目描述内容结构（章节、段落要点、叙事顺序等），不是制作任务或部门分工
2. 不要指定 writing/design 等部门
3. 条目数量 3–8 条，覆盖从开篇到发布的完整结构
4. 只输出结构化大纲，不生成正文`;
}

function applyOutlineResponse(
  existing: WorkOutline,
  response: { summary: string; sections: Array<{ description: string }> },
): WorkOutline {
  return {
    ...existing,
    sections: response.sections.map((s) => newOutlineSection(s.description)),
    summary: response.summary,
  };
}

export async function bootstrapOutlineFromBrief(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  if (!shouldBootstrapOutlineFromBrief(state)) {
    return {};
  }

  const existing = parseOutline(state);
  const llm = createStructuredModel({ temperature: 0.5 });

  try {
    const parsed = await invokeStructuredOutput(
      llm,
      OutlineResponseSchema,
      [new HumanMessage(buildBootstrapOutlinePrompt(state))],
      { name: "outline_bootstrap" },
    );
    return { outline: applyOutlineResponse(existing, parsed) };
  } catch {
    return {
      outline: {
        ...existing,
        sections: [
          newOutlineSection("开篇钩子与核心观点"),
          newOutlineSection("主体内容与案例展开"),
          newOutlineSection("总结与行动号召"),
        ],
        summary: "基础内容大纲",
      },
    };
  }
}
