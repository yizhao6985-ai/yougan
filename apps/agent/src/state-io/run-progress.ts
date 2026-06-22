import type { RunProgress, RunProgressPhase } from "@yougan/domain";

import type { AgentStatePatch } from "#agent/state.js";

const RUN_PHASE_LABELS: Record<RunProgressPhase, string> = {
  turn_planning: "正在理解你的意图…",
  reference: "正在分析参考素材…",
  profile: "正在整理制作方案…",
  collect_revision: "正在记录改稿意见…",
  production: "正在创作…",
  revise: "正在改稿…",
  ask: "正在准备回答…",
  turn_briefing: "正在整理本回合…",
  messages_summary: "正在整理对话记录…",
  production_confirm: "等待确认是否开始创作",
  revise_confirm: "等待确认是否开始改稿",
};

export function buildRunProgress(phase: RunProgressPhase): RunProgress {
  return {
    phase,
    label: RUN_PHASE_LABELS[phase],
    updatedAt: Date.now(),
  };
}

export function patchRunProgress(phase: RunProgressPhase): AgentStatePatch {
  return { runProgress: buildRunProgress(phase) };
}

export function clearRunProgressPatch(): AgentStatePatch {
  return { runProgress: null };
}
