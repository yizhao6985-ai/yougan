/** work node：部门专员产出交付物片段 */
import { HumanMessage } from "@langchain/core/messages";

import { createChatModel } from "#agent/model/dashscope.js";
import {
  resolveContentSpecFromProfile,
  type WorkPreview,
} from "@yougan/domain";
import {
  mergeStagingPatches,
  patchStagingPreview,
  patchStagingProductionMeta,
  patchStagingProductionPlan,
} from "#agent/runtime/staging-writes.js";
import {
  parseModelTemperature,
  parsePreview,
  parseProductionPlan,
  parseProfile,
} from "#agent/runtime/state-readers.js";
import type { AgentStateType } from "#agent/state.js";

import { markDepartmentTaskPendingInspect } from "../../helpers/set-pending-inspect.js";
import {
  buildSpawnSpecialistPrompt,
  specialistDisplayName,
} from "./prompt.js";

export async function spawnSpecialistNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const pending = state.staging?.meta.production?.pendingSpawnSpecialist;
  if (!pending) {
    return {};
  }

  const profile = parseProfile(state);
  const plan = parseProductionPlan(state);
  const contentProfile = resolveContentSpecFromProfile(profile);
  const { department, brief, specialist_name } = pending;
  const name = specialistDisplayName(department, specialist_name);

  const llm = createChatModel({
    temperature: parseModelTemperature(state),
  });
  const prompt = buildSpawnSpecialistPrompt({
    profile,
    plan,
    department,
    brief,
    specialistName: name,
  });

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

  const existing = parsePreview(state);
  const section = `\n\n---\n### ${name}（${department}）\n${output}`;
  const preview: WorkPreview = existing
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

  const pendingTasks = plan.pending_tasks.map((task) =>
    task.department === department && !task.assignee
      ? { ...task, assignee: name, status: "in_progress" as const }
      : task,
  );

  const pipeline = department === "design" ? "design" : "writing";
  const inspectPatch =
    markDepartmentTaskPendingInspect(state, pendingTasks, department, pipeline) ??
    {};

  return mergeStagingPatches(
    patchStagingPreview(state, preview),
    patchStagingProductionPlan(state, {
      ...plan,
      pending_tasks: pendingTasks,
    }),
    inspectPatch,
    patchStagingProductionMeta(state, { pendingSpawnSpecialist: null }),
  );
}
