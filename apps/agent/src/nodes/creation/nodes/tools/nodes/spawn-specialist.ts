import { HumanMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { createChatModel } from "#agent/llm/dashscope.js"
import { blueprintToContentProfile } from "#agent/lib/blueprint/content-profile.js";
import { departmentBrief } from "#agent/lib/industry-prompts.js"
import { getPlanSummary, type WorkDraft } from "#agent/schema.js"
import {
  parseActiveTurnKind,
  parseBlueprint,
  parseModelTemperature,
  parseProductionPlan,
} from "#agent/lib/parse-agent-state.js";
import { getState } from "#agent/lib/tool-state.js"
import { toolCommand } from "#agent/lib/tool-command.js"
import { blueprintSummary } from "#agent/prompt/context.js"

import { DEPARTMENT_LABELS } from "./shared.js";

export const spawnSpecialist = tool(
  async ({ department, brief, specialist_name }, config) => {
    const state = getState();
    if (parseActiveTurnKind(state) !== "creation") {
      return toolCommand(config, "spawn_specialist 仅在创作模式可用。");
    }

    const blueprint = parseBlueprint(state);
    const contentProfile = blueprintToContentProfile(blueprint);
    const plan = parseProductionPlan(state);
    const label = DEPARTMENT_LABELS[department];
    const name = specialist_name?.trim() || label;
    const industry = plan.industry_context ?? "";

    const llm = createChatModel({
      temperature: parseModelTemperature(state),
    });

    const prompt = `你是${name}（${departmentBrief(department)}），执行以下任务：

任务说明：${brief}

作品主题：${contentProfile.content_topic ?? "未指定"}
体裁：${contentProfile.content_format ?? "未指定"}
作品方案：${blueprintSummary(blueprint)}
创作计划：${getPlanSummary(plan) ?? "无"}
行业背景：${industry}

请输出该部门的专业交付物，用 Markdown 格式。`;

    let output: string;
    try {
      const response = await llm.invoke([new HumanMessage(prompt)]);
      output =
        typeof response.content === "string"
          ? response.content
          : JSON.stringify(response.content);
    } catch {
      output = `${name}暂时无法完成该任务，请稍后重试。`;
    }

    const existing = state.draft;
    const section = `\n\n---\n### ${name}（${department}）\n${output}`;
    const draft: WorkDraft = existing
      ? {
          ...existing,
          notes: (existing.notes ?? "") + section,
        }
      : {
          platform: contentProfile.platform ?? "yougan",
          title: contentProfile.content_topic ?? null,
          body: output,
          notes: section,
          publish_ready: false,
        };

    const pending = plan.pending_tasks.map((task) =>
      task.department === department && !task.assignee
        ? { ...task, assignee: name, status: "in_progress" as const }
        : task,
    );

    return toolCommand(config, `${name} 已完成任务。`, {
      draft,
      plan: { ...plan, pending_tasks: pending },
    });
  },
  {
    name: "spawn_specialist",
    description:
      "临时创建部门专员执行任务。design=配图；audio=口播；video=分镜；writing 请用 generate_draft。",
    schema: z.object({
      department: z
        .enum(["writing", "design", "audio", "video"])
        .describe("部门"),
      brief: z.string().describe("交给专员的具体任务说明"),
      specialist_name: z
        .string()
        .optional()
        .describe("专员称呼"),
    }),
  },
);
