import { HumanMessage } from "@langchain/core/messages";

import { createStructuredModel } from "#agent/llm/dashscope.js";
import { invokeStructuredOutput } from "../structured-output.js";
import { blueprintSummary } from "#agent/prompt/context.js";
import { resolveIndustryContext } from "../industry-prompts.js";
import {
  newBlueprintBeat,
  type WorkBlueprint,
} from "@yougan/domain";
import { parseBlueprint } from "../parse-agent-state.js";
import type { AgentStateType } from "#agent/state.js";
import { BlueprintResponseSchema } from "./response-schema.js";
import { blueprintToContentProfile } from "./content-profile.js";

/** 整体换方向时全量重做 blueprint beats */
export async function reviseBlueprintFull(
  state: AgentStateType,
  reason: string,
): Promise<Partial<AgentStateType>> {
  const existing = parseBlueprint(state);
  const profile = blueprintToContentProfile(existing);
  const industry = resolveIndustryContext(profile);
  const llm = createStructuredModel({ temperature: 0.5 });

  const prompt = `你是作品方案策划，请根据新要求重新制定作品方案结构。

调整原因：${reason.trim() || "用户新要求"}

${blueprintSummary(existing)}
行业：${industry}

输出 premise + 3–8 个有序 beats，不要部门分工。`;

  try {
    const parsed = await invokeStructuredOutput(
      llm,
      BlueprintResponseSchema,
      [new HumanMessage(prompt)],
      { name: "blueprint_full_revise" },
    );
    const blueprint: WorkBlueprint = {
      ...existing,
      premise: parsed.premise.trim(),
      beats: parsed.beats.map((b) =>
        newBlueprintBeat(b.description, b.intent),
      ),
    };
    return { blueprint };
  } catch {
    return {};
  }
}
