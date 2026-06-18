import type {
  NextStepSuggestion,
  ProfileSetupSuggestionRole,
} from "../../models/agent/suggestions.js";
import type {
  ProfileSetupStep,
  ProfileStepId,
  WorkProfile,
} from "../../models/work/profile.js";
import { parseProfileJson } from "./profile.js";
import {
  PROFILE_SETUP_FLOW,
  getActiveProfileStep,
  getProfileSetupState,
  isProfileSetupPhase,
  isProfileSetupReady,
  isProfileStepFilled,
} from "./profile-setup.js";
import { getProfileStepCopy } from "./profile-step-copy.js";

export type ProfileSetupSuggestionSlot = {
  role: ProfileSetupSuggestionRole;
  step: ProfileStepId | "ready";
  layer: "consolidate" | "advance";
};

export type ProfileSetupSuggestionFocus = {
  activeStep: ProfileSetupStep;
  newlyFilledSteps: ProfileStepId[];
  activeStatus: "empty" | "partial" | "filled";
  activeGaps: string[];
  recentStepSummaries: Partial<Record<ProfileStepId, string>>;
  nextStep: ProfileStepId | "ready" | null;
};

function getNextProfileStep(
  step: ProfileSetupStep,
): ProfileStepId | "ready" | null {
  if (step === "ready") return null;
  const idx = PROFILE_SETUP_FLOW.indexOf(step);
  if (idx < 0) return null;
  return PROFILE_SETUP_FLOW[idx + 1] ?? "ready";
}

function getActiveStepStatus(
  profile: WorkProfile,
  step: ProfileSetupStep,
): ProfileSetupSuggestionFocus["activeStatus"] {
  if (step === "ready") {
    return isProfileSetupReady(profile) ? "filled" : "empty";
  }
  const setup = getProfileSetupState(profile);
  const stepState = setup.steps.find((item) => item.id === step);
  if (!stepState) return "empty";
  const filledItems = stepState.items.filter((item) => item.filled).length;
  if (filledItems === 0) return "empty";
  if (stepState.filled) return "filled";
  return "partial";
}

function getActiveGaps(profile: WorkProfile, step: ProfileSetupStep): string[] {
  if (step === "ready") return [];
  const setup = getProfileSetupState(profile);
  const stepState = setup.steps.find((item) => item.id === step);
  return stepState?.items.filter((item) => !item.filled).map((item) => item.key) ?? [];
}

export function diffNewlyFilledProfileSteps(
  before: WorkProfile | undefined,
  after: WorkProfile | undefined,
): ProfileStepId[] {
  const beforeProfile = parseProfileJson(before);
  const afterProfile = parseProfileJson(after);
  return PROFILE_SETUP_FLOW.filter(
    (step) =>
      !isProfileStepFilled(beforeProfile, step) &&
      isProfileStepFilled(afterProfile, step),
  );
}

export function summarizeProfileStepForSuggestions(
  profile: WorkProfile,
  step: ProfileStepId,
): string {
  switch (step) {
    case "intent":
      return profile.intent.summary.trim() || "（空）";
    case "delivery": {
      const parts: string[] = [];
      if (profile.delivery.format) parts.push(`形态 ${profile.delivery.format}`);
      if (profile.delivery.modalities.length) {
        parts.push(`媒介 ${profile.delivery.modalities.join("+")}`);
      }
      const { media_params: mp } = profile.delivery;
      const { min, max } = mp.text?.word_count ?? {};
      if (min != null || max != null) {
        parts.push(`字数 ${min ?? "?"}-${max ?? "?"}`);
      }
      if (mp.video?.duration_sec != null) {
        parts.push(`时长约 ${mp.video.duration_sec} 秒`);
      }
      return parts.join("；") || "（空）";
    }
    case "expression": {
      const parts: string[] = [];
      if (profile.expression.audience?.trim()) {
        parts.push(`受众 ${profile.expression.audience.trim()}`);
      }
      if (profile.expression.verbal?.trim()) {
        parts.push(`文字 ${profile.expression.verbal.trim()}`);
      }
      if (profile.expression.visual?.trim()) {
        parts.push(`画面 ${profile.expression.visual.trim()}`);
      }
      return parts.join("；") || "（空）";
    }
    case "structure": {
      const parts: string[] = [];
      if (profile.structure.settings.length > 0) {
        parts.push(`设定 ${profile.structure.settings.length} 条`);
      }
      if (profile.structure.segments.length > 0) {
        parts.push(`大纲 ${profile.structure.segments.length} 段`);
      }
      return parts.join("；") || "（空）";
    }
    case "constraints":
      return profile.constraints.rules.length > 0
        ? `规则 ${profile.constraints.rules.length} 条`
        : "（空）";
    default:
      return "（空）";
  }
}

export function buildProfileSetupSuggestionFocus(input: {
  before: WorkProfile | undefined;
  after: WorkProfile | undefined;
}): ProfileSetupSuggestionFocus {
  const afterProfile = parseProfileJson(input.after);
  const newlyFilledSteps = diffNewlyFilledProfileSteps(input.before, input.after);
  const activeStep = getActiveProfileStep(afterProfile);
  const activeStatus = getActiveStepStatus(afterProfile, activeStep);
  const activeGaps = getActiveGaps(afterProfile, activeStep);
  const nextStep = getNextProfileStep(activeStep);

  const recentStepSummaries: Partial<Record<ProfileStepId, string>> = {};
  for (const step of newlyFilledSteps) {
    recentStepSummaries[step] = summarizeProfileStepForSuggestions(
      afterProfile,
      step,
    );
  }
  if (
    activeStep !== "ready" &&
    isProfileStepFilled(afterProfile, activeStep) &&
    !recentStepSummaries[activeStep]
  ) {
    recentStepSummaries[activeStep] = summarizeProfileStepForSuggestions(
      afterProfile,
      activeStep,
    );
  }

  return {
    activeStep,
    newlyFilledSteps,
    activeStatus,
    activeGaps,
    recentStepSummaries,
    nextStep,
  };
}

function getConsolidationStep(
  focus: ProfileSetupSuggestionFocus,
  profile: WorkProfile,
): ProfileStepId {
  // 巩固层灵感必须与侧栏「当前推进步」一致，禁止回溯前几步
  if (focus.activeStep !== "ready") {
    return focus.activeStep;
  }

  for (let i = PROFILE_SETUP_FLOW.length - 1; i >= 0; i -= 1) {
    const step = PROFILE_SETUP_FLOW[i]!;
    if (isProfileStepFilled(profile, step)) return step;
  }
  return "intent";
}

function buildTurnSuggestionSlots(
  focus: ProfileSetupSuggestionFocus,
  profile: WorkProfile,
  count: number,
): ProfileSetupSuggestionSlot[] {
  if (focus.activeStep === "ready") {
    const consolidateStep = getConsolidationStep(focus, profile);
    const readySlots: ProfileSetupSuggestionSlot[] = [
      { role: "refine", step: consolidateStep, layer: "consolidate" },
      { role: "refine", step: consolidateStep, layer: "consolidate" },
      { role: "refine", step: consolidateStep, layer: "consolidate" },
      { role: "navigate", step: "ready", layer: "advance" },
    ];
    return readySlots.slice(0, count);
  }

  const consolidateStep = getConsolidationStep(focus, profile);
  const nextStep = focus.nextStep ?? "ready";

  if (count === 4) {
    const turnSlots: ProfileSetupSuggestionSlot[] = [
      { role: "refine", step: consolidateStep, layer: "consolidate" },
      { role: "refine", step: consolidateStep, layer: "consolidate" },
      { role: "refine", step: consolidateStep, layer: "consolidate" },
      { role: "navigate", step: nextStep, layer: "advance" },
    ];
    return turnSlots;
  }

  const slots: ProfileSetupSuggestionSlot[] = [];
  const consolidateCount = Math.max(1, count - 1);
  for (let i = 0; i < consolidateCount; i += 1) {
    slots.push({ role: "refine", step: consolidateStep, layer: "consolidate" });
  }
  slots.push({ role: "navigate", step: nextStep, layer: "advance" });
  return slots.slice(0, count);
}

export function buildProfileSetupSuggestionSlots(
  focus: ProfileSetupSuggestionFocus,
  count: number,
  profile?: WorkProfile,
): ProfileSetupSuggestionSlot[] {
  const parsed = parseProfileJson(profile);
  return buildTurnSuggestionSlots(focus, parsed, count);
}

/** 方案引导阶段：按槽位配方覆盖 step/role，保证巩固 3 + 推进 1 分组稳定 */
export function resolveProfileSetupSuggestionRoles(
  suggestions: NextStepSuggestion[],
  input: {
    profile: WorkProfile | undefined;
    beforeProfile?: WorkProfile | undefined;
  },
): NextStepSuggestion[] {
  const profile = parseProfileJson(input.profile);
  if (!isProfileSetupPhase(profile) || suggestions.length === 0) {
    return suggestions;
  }

  const focus = buildProfileSetupSuggestionFocus({
    before: input.beforeProfile,
    after: profile,
  });
  const slots = buildProfileSetupSuggestionSlots(
    focus,
    suggestions.length,
    profile,
  );

  return suggestions.map((item, index) => {
    const slot = slots[index];
    if (!slot) return item;
    return {
      ...item,
      step: slot.step,
      role: slot.role,
    };
  });
}

export function splitProfileSetupSuggestionLayers(
  suggestions: NextStepSuggestion[],
  input: {
    profile: WorkProfile | undefined;
    beforeProfile?: WorkProfile | undefined;
  },
): {
  consolidate: NextStepSuggestion[];
  advance: NextStepSuggestion[];
} | null {
  const normalized = resolveProfileSetupSuggestionRoles(suggestions, input);
  const profile = parseProfileJson(input.profile);
  if (!isProfileSetupPhase(profile) || normalized.length < 2) {
    return null;
  }

  const focus = buildProfileSetupSuggestionFocus({
    before: input.beforeProfile,
    after: profile,
  });
  const slots = buildProfileSetupSuggestionSlots(
    focus,
    normalized.length,
    profile,
  );

  const consolidate: NextStepSuggestion[] = [];
  const advance: NextStepSuggestion[] = [];

  normalized.forEach((item, index) => {
    const slot = slots[index];
    if (slot?.layer === "advance") {
      advance.push(item);
      return;
    }
    if (slot?.layer === "consolidate") {
      consolidate.push(item);
      return;
    }
    if (item.role === "navigate") {
      advance.push(item);
      return;
    }
    if (item.role === "refine") {
      consolidate.push(item);
    }
  });

  if (consolidate.length === 0 && advance.length === 0) {
    return null;
  }

  return { consolidate, advance };
}

function formatStepLabel(
  profile: WorkProfile,
  step: ProfileStepId | "ready",
): string {
  const setup = getProfileSetupState(profile);
  const stepState = setup.steps.find((item) => item.id === step);
  if (stepState) {
    return `第 ${stepState.index} 步 · ${stepState.title}`;
  }
  return getProfileStepCopy(profile, step).title;
}

export function buildProfileSetupSuggestionHint(
  focus: ProfileSetupSuggestionFocus,
  profile: WorkProfile | undefined,
): string {
  const parsed = parseProfileJson(profile);

  if (focus.activeStep === "ready") {
    return "方案已就绪 — 开始制作，或再补一项细节";
  }

  const activeLabel = formatStepLabel(parsed, focus.activeStep);
  const activeTitle = getProfileStepCopy(parsed, focus.activeStep).title;

  if (focus.activeStatus === "empty") {
    return `当前「${activeTitle}」— 前 3 条给本步灵感，最后 1 条引导下一步`;
  }

  return `${activeLabel} — 前 3 条延伸本步灵感，最后 1 条引导下一步`;
}

export function buildProfileSetupSuggestionPromptBlock(
  focus: ProfileSetupSuggestionFocus,
  profile: WorkProfile | undefined,
): string {
  const parsed = parseProfileJson(profile);
  const setup = getProfileSetupState(parsed);
  const activeMeta = setup.steps.find((step) => step.id === focus.activeStep);

  const lines = [
    "## 方案建议上下文（双焦点）",
    "- 槽位配比：巩固层 3 条（当前步灵感）+ 推进层 1 条（引导进入下一步）",
    "- **重要**：巩固层 step = 当前推进步；推进层 step = 下一步（见「再下一步」）；禁止写无关步骤内容",
    `- 当前推进步：${activeMeta ? `第 ${activeMeta.index} 步 · ${activeMeta.title}` : focus.activeStep}（${focus.activeStatus}）`,
  ];

  if (focus.activeStep !== "ready") {
    const copy = getProfileStepCopy(parsed, focus.activeStep);
    lines.push(`- 本步要填什么：${copy.hint}`);
    lines.push(
      `- 本步灵感方向参考（巩固层须落在此步，勿逐字复制）：${copy.suggestionExamples.join("；")}`,
    );
    const activeSummary = summarizeProfileStepForSuggestions(
      parsed,
      focus.activeStep,
    );
    if (activeSummary !== "（空）") {
      lines.push(`- 本步已写摘要：${activeSummary}`);
    }
  }

  if (focus.newlyFilledSteps.length > 0) {
    const newlyFilled = focus.newlyFilledSteps
      .map((step) => {
        const meta = setup.steps.find((item) => item.id === step);
        const summary = focus.recentStepSummaries[step] ?? "";
        return meta
          ? `第 ${meta.index} 步 · ${meta.title}（${summary}）`
          : `${step}（${summary}）`;
      })
      .join("；");
    lines.push(`- 本回合新完成：${newlyFilled}`);
  } else {
    lines.push("- 本回合新完成：（无）");
  }

  if (focus.nextStep) {
    const nextMeta = setup.steps.find((step) => step.id === focus.nextStep);
    lines.push(
      `- 再下一步：${nextMeta ? `第 ${nextMeta.index} 步 · ${nextMeta.title}` : focus.nextStep}`,
    );
  }

  if (focus.activeGaps.length > 0) {
    lines.push(`- 当前推进步缺口：${focus.activeGaps.join("、")}`);
  }

  for (const step of focus.newlyFilledSteps) {
    const summary = focus.recentStepSummaries[step];
    if (summary) {
      const title = getProfileStepCopy(parsed, step).title;
      lines.push(`- 「${title}」已写摘要：${summary}`);
    }
  }

  lines.push(
    `- 建议 hint 参考：${buildProfileSetupSuggestionHint(focus, parsed)}`,
  );

  return lines.join("\n");
}

export function buildProfileSetupSuggestionSlotRecipe(
  focus: ProfileSetupSuggestionFocus,
  count: number,
  profile: WorkProfile | undefined,
): string {
  const parsed = parseProfileJson(profile);
  const slots = buildProfileSetupSuggestionSlots(focus, count, parsed);
  const layerLabels = {
    consolidate: "巩固层",
    advance: "推进层",
  } as const;
  const lines = slots.map((slot, index) => {
    const stepTitle = getProfileStepCopy(parsed, slot.step).title;
    return `${index + 1}. [${layerLabels[slot.layer]}] role=${slot.role} · step=${slot.step}（${stepTitle}）`;
  });

  return [
    "## 建议槽位配方（须逐条对应）",
    "- 巩固层 refine：step = 当前推进步；围绕本步给灵感/可填入示例",
    "- 推进层 navigate：step = 下一步；message 像用户主动进入该步（或 ready 时说开始制作），禁止空泛套话",
    ...lines,
  ].join("\n");
}
