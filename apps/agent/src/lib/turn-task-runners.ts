import { HumanMessage } from "@langchain/core/messages";

import {
  findOutlineSectionIndex,
  newBriefRequirement,
  newOutlineSection,
  type WorkOutline,
} from "@yougan/domain";

import { createStructuredModel } from "../llm/dashscope.js";
import { invokeStructuredOutput } from "./structured-output.js";
import { syncReferenceImagesFromLatestMessage } from "./sync-reference-images.js";
import {
  briefSummary,
  outlineSummary,
  profileSummary,
} from "../prompt/context.js";
import { YOUGAN_USER_LABEL } from "../prompt/persona.js";
import { resolveIndustryContext } from "./industry-prompts.js";
import { resolveContentSpec } from "./content-spec.js";
import {
  parseBrief,
  parseOutline,
  parseProfile,
} from "./parse-agent-state.js";
import { runUpdateOutline } from "../nodes/update-outline/logic.js";
import { OutlineResponseSchema } from "../nodes/update-outline/schema.js";
import { getLatestHumanMessageText } from "./human-message/index.js";
import type { AgentStateType } from "../state.js";
import {
  BriefTurnPatchSchema,
  OutlineTurnPatchSchema,
} from "../nodes/turn-task/schemas.js";

function buildBriefPatchPrompt(state: AgentStateType, userMessage: string): string {
  const brief = parseBrief(state);
  return `你是 brief 整理助手（内部角色）。根据${YOUGAN_USER_LABEL}最新一条消息，提取**已明确确认**、应写入 brief 的新需求（每条一句）。
- 不要写入探索性、未确认的想法
- 不要重复已有条目
- 若无应新增条目，返回空数组

已有 brief：
${brief.requirements.length
    ? brief.requirements.map((r) => `- [${r.id}] ${r.description}`).join("\n")
    : "（尚无）"}

${YOUGAN_USER_LABEL}消息：
${userMessage}`;
}

function buildOutlinePatchPrompt(state: AgentStateType, userMessage: string): string {
  const outline = parseOutline(state);
  const brief = parseBrief(state);
  return `你是大纲整理助手（内部角色）。根据${YOUGAN_USER_LABEL}最新一条消息，输出对内容结构的增删改。
- 只改结构条目，不写正文
- 若用户要求整体换方向/重写结构，设 full_revise=true 并填写 revise_reason
- 若无结构变更，各数组留空且 full_revise=false

当前大纲：
${outline.sections.length
    ? outline.sections.map((s) => `- [${s.id}] ${s.description}`).join("\n")
    : "（尚无条目）"}
${outlineSummary(outline)}

brief 参考（${brief.requirements.length} 条）：
${briefSummary(brief)}

${YOUGAN_USER_LABEL}消息：
${userMessage}`;
}

export async function runReferencesTask(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  return syncReferenceImagesFromLatestMessage(state);
}

export async function runBriefTask(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const userMessage = getLatestHumanMessageText(state.messages);
  if (!userMessage) return {};

  const llm = createStructuredModel({ temperature: 0.2 });
  try {
    const patch = await invokeStructuredOutput(
      llm,
      BriefTurnPatchSchema,
      [new HumanMessage(buildBriefPatchPrompt(state, userMessage))],
      { name: "brief_turn_patch" },
    );
    const brief = parseBrief(state);
    let nextRequirements = [...brief.requirements];
    for (const raw of patch.add_requirements) {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      const exists = nextRequirements.some(
        (item) => item.description.trim() === trimmed,
      );
      if (exists) continue;
      nextRequirements = [...nextRequirements, newBriefRequirement(trimmed)];
    }
    if (nextRequirements.length === brief.requirements.length) {
      return {};
    }
    return { brief: { ...brief, requirements: nextRequirements } };
  } catch {
    return {};
  }
}

async function applyOutlineRevise(
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
      { name: "outline_turn_revise" },
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

export async function runOutlinePatchTask(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const userMessage = getLatestHumanMessageText(state.messages);
  if (!userMessage) return {};

  const llm = createStructuredModel({ temperature: 0.2 });
  try {
    const patch = await invokeStructuredOutput(
      llm,
      OutlineTurnPatchSchema,
      [new HumanMessage(buildOutlinePatchPrompt(state, userMessage))],
      { name: "outline_turn_patch" },
    );

    if (patch.full_revise) {
      return applyOutlineRevise(
        state,
        patch.revise_reason?.trim() || userMessage.slice(0, 200),
      );
    }

    const outline = parseOutline(state);
    let sections = [...outline.sections];

    for (const id of patch.delete_section_ids) {
      sections = sections.filter((section) => section.id !== id);
    }

    for (const update of patch.update_sections) {
      const index = findOutlineSectionIndex(
        { ...outline, sections },
        update.section_id,
      );
      if (index < 0) continue;
      sections[index] = {
        ...sections[index]!,
        description: update.description.trim(),
      };
    }

    for (const raw of patch.add_sections) {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      const exists = sections.some(
        (item) => item.description.trim() === trimmed,
      );
      if (exists) continue;
      sections = [...sections, newOutlineSection(trimmed)];
    }

    if (
      sections.length === outline.sections.length &&
      sections.every(
        (s, i) => s.description === outline.sections[i]?.description,
      )
    ) {
      return {};
    }

    return { outline: { ...outline, sections } };
  } catch {
    return {};
  }
}

export async function runEnsureOutlineTask(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  return runUpdateOutline(state);
}
