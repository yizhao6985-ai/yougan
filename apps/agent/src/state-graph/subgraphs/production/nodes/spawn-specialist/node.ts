/** work node：部门专员产出交付物片段 */
import { HumanMessage } from "@langchain/core/messages";

import { invokeStructured } from "#agent/llm/invoke/index.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import {
  resolveContentSpecFromProfile,
  type WorkPreview,
} from "@yougan/domain";
import {
  patchPendingBatch,
  patchPendingPreview,
  patchPendingProductionMeta,
  patchPendingProductionPlan,
} from "#agent/state-io/index.js";
import {
  getModelTemperature,
  getPreview,
  getProductionPlan,
  getProductionStagingMeta,
  getProfile,
} from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

import { markDepartmentTaskPendingInspect } from "../inspect-production/helpers/set-pending-inspect.js";
import {
  buildSpawnSpecialistPrompt,
  specialistDisplayName,
} from "./prompt.js";
import { MarkdownDeliverableSchema } from "./schema.js";

export async function spawnSpecialistNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const meta = getProductionStagingMeta(state);
  let pending = meta.pendingSpawnSpecialist;
  const plan = getProductionPlan(state);

  if (!pending) {
    const designTask = plan.pending_tasks.find((t) => t.department === "design");
    if (designTask) {
      pending = {
        department: "design",
        brief: designTask.description,
        specialist_name: null,
      };
    } else {
      return {};
    }
  }

  const profile = getProfile(state);
  const contentProfile = resolveContentSpecFromProfile(profile);
  const { department, brief, specialist_name } = pending;
  const name = specialistDisplayName(department, specialist_name);

  const llm = createChatModel({
    temperature: getModelTemperature(state),
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
    const parsed = await invokeStructured(
      llm,
      MarkdownDeliverableSchema,
      [new HumanMessage(prompt)],
      { name: "spawn_specialist_deliverable" },
    );
    output = parsed.body;
  } catch {
    output = `${name}暂时无法完成该任务，请稍后重试。`;
  }

  const existing = getPreview(state);
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

  return patchPendingBatch(
    patchPendingPreview(state, preview),
    patchPendingProductionPlan(state, {
      ...plan,
      pending_tasks: pendingTasks,
    }),
    inspectPatch,
    patchPendingProductionMeta(state, { pendingSpawnSpecialist: null }),
  );
}
