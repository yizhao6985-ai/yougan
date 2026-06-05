/** 质检不通过时，按反馈重写单任务交付物（preview 片段） */
import { HumanMessage } from "@langchain/core/messages";

import { createChatModel } from "#agent/model/dashscope.js";
import { departmentBrief } from "./department-brief.js";
import {
  getPlanSummary,
  profileSummary,
  resolveContentSpecFromProfile,
  type ProductionDepartment,
  type WorkPreview,
} from "@yougan/domain";

type RetryablePlanTask = {
  id: string;
  description: string;
  department?: ProductionDepartment;
};
import {
  parsePreview,
  parseProductionPlan,
  parseProfile,
} from "#agent/runtime/state-readers.js";
import type { AgentStateType } from "#agent/state.js";

import { DEPARTMENT_LABELS } from "./department-labels.js";

export async function retryTaskDeliverable(
  state: AgentStateType,
  task: RetryablePlanTask,
  feedback: string,
): Promise<WorkPreview | null> {
  const profile = parseProfile(state);
  const plan = parseProductionPlan(state);
  const contentProfile = resolveContentSpecFromProfile(profile);
  const department = task.department ?? "writing";
  const label = DEPARTMENT_LABELS[department];
  const existing = parsePreview(state);

  const llm = createChatModel({ temperature: 0.4 });
  const prompt = `你是${label}（${departmentBrief(department)}），请根据质检反馈**立即重做**以下任务。

任务：${task.description}
质检反馈：${feedback}

作品主题：${contentProfile.content_topic ?? "未指定"}
体裁：${contentProfile.content_format ?? "未指定"}
作品方案：${profileSummary(profile)}
制作计划：${getPlanSummary(plan) ?? "无"}

输出该任务的专业交付物（Markdown）。`;

  try {
    const response = await llm.invoke([new HumanMessage(prompt)]);
    const output =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);

    const section = `\n\n---\n### ${label}（重试 · ${department}）\n${output}`;
    if (existing) {
      return {
        ...existing,
        body:
          department === "writing" && !existing.body?.trim()
            ? output
            : existing.body,
        notes: (existing.notes ?? "") + section,
      };
    }
    return {
      platform: contentProfile.platform ?? "yougan",
      title: contentProfile.content_topic ?? null,
      body: output,
      notes: section,
      publish_ready: false,
    };
  } catch {
    return existing;
  }
}
