/**
 * blueprint 有内容意图但无 beats 时，在进入 blueprint 对话前生成初版结构。
 */
import { HumanMessage } from "@langchain/core/messages";

import { createStructuredModel } from "#agent/llm/dashscope.js";
import { invokeStructuredOutput } from "../structured-output.js";
import { blueprintSummary } from "#agent/prompt/context.js";
import { YOUGAN_USER_LABEL } from "#agent/prompt/persona.js";
import { resolveIndustryContext } from "../industry-prompts.js";
import {
  hasBlueprintContent,
  newBlueprintBeat,
  type WorkBlueprint,
} from "@yougan/domain";
import { parseBlueprint } from "../parse-agent-state.js";
import type { AgentStateType } from "#agent/state.js";
import { BlueprintResponseSchema } from "./response-schema.js";
import { blueprintToContentProfile } from "./content-profile.js";

export function shouldBootstrapBlueprintBeats(
  state: AgentStateType,
): boolean {
  const blueprint = parseBlueprint(state);
  if (blueprint.beats.length > 0) return false;
  return hasBlueprintContent(blueprint);
}

function buildBootstrapPrompt(state: AgentStateType): string {
  const blueprint = parseBlueprint(state);
  const profile = blueprintToContentProfile(blueprint);
  const industry = resolveIndustryContext(profile);

  return `你是作品方案策划（内部角色，不对${YOUGAN_USER_LABEL}直接说话），根据当前方案制定**有序内容节拍**。

${YOUGAN_USER_LABEL}当前方案：
${blueprintSummary(blueprint)}

行业经验：
${industry}

请输出：
1. premise：一句话定位（若已有可优化）
2. beats：3–8 个有序节拍，覆盖从开篇到结尾
3. 只输出结构，不生成正文`;
}

function applyBlueprintResponse(
  existing: WorkBlueprint,
  response: { premise: string; beats: Array<{ description: string; intent?: string | null }> },
): WorkBlueprint {
  return {
    ...existing,
    premise: response.premise.trim() || existing.premise,
    beats: response.beats.map((b) =>
      newBlueprintBeat(b.description, b.intent),
    ),
  };
}

export async function bootstrapBlueprintBeats(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  if (!shouldBootstrapBlueprintBeats(state)) {
    return {};
  }

  const existing = parseBlueprint(state);
  const llm = createStructuredModel({ temperature: 0.5 });

  try {
    const parsed = await invokeStructuredOutput(
      llm,
      BlueprintResponseSchema,
      [new HumanMessage(buildBootstrapPrompt(state))],
      { name: "blueprint_bootstrap" },
    );
    return { blueprint: applyBlueprintResponse(existing, parsed) };
  } catch {
    return {
      blueprint: {
        ...existing,
        premise: existing.premise || "基础作品方案",
        beats: [
          newBlueprintBeat("开篇钩子与核心观点"),
          newBlueprintBeat("主体内容与案例展开"),
          newBlueprintBeat("总结与行动号召"),
        ],
      },
    };
  }
}
