import type {
  NextStepSuggestion,
  ProfileSetupSuggestionRole,
} from "../../models/agent/suggestions.js";
import type {
  ProfileSetupStep,
  ProfileStepId,
  WorkProfile,
} from "../../models/work/profile.js";
import { parseProfileJson, isProfileEmpty } from "./profile.js";
import {
  PROFILE_SETUP_FLOW,
  getActiveProfileStep,
  getProfileSetupState,
  isProfileSetupReady,
  isProfileStepFilled,
  summarizeProfileStepForSuggestions,
} from "./profile-setup.js";
import { getProfileStepCopy, getStyleFieldsForProfile } from "./profile-step-copy.js";

export type ProfileSetupSuggestionSlot = {
  role: ProfileSetupSuggestionRole;
  step?: ProfileStepId | "ready";
  layer: "consolidate" | "advance";
};

export type SuggestionLayerCounts = {
  consolidate: number;
  advance: number;
};

export type SuggestionContextInput = {
  profile: WorkProfile | undefined;
  beforeProfile?: WorkProfile | undefined;
  hasPreview?: boolean;
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

function formatStyleFieldFocus(profile: WorkProfile): string {
  const fields = getStyleFieldsForProfile(profile);
  if (fields.length === 1 && fields[0] === "visual") {
    return "画面风格（构图、笔触、配色、光影）；不要写语气、文风";
  }
  if (fields.length === 1 && fields[0] === "verbal") {
    return "文字语气与文风；不要写画面、配色";
  }
  return "文字语气与画面方向；可分别给语气向或画面向，但须紧扣已定方向";
}

function getPriorFilledSteps(
  profile: WorkProfile,
  beforeStep: ProfileStepId | "ready",
): ProfileStepId[] {
  if (beforeStep === "ready") {
    return PROFILE_SETUP_FLOW.filter((step) =>
      isProfileStepFilled(profile, step),
    );
  }
  const idx = PROFILE_SETUP_FLOW.indexOf(beforeStep);
  if (idx <= 0) return [];
  return PROFILE_SETUP_FLOW.slice(0, idx).filter((step) =>
    isProfileStepFilled(profile, step),
  );
}

function summarizePriorSteps(
  profile: WorkProfile,
  beforeStep: ProfileStepId | "ready",
): string {
  const prior = getPriorFilledSteps(profile, beforeStep);
  if (!prior.length) return "（无）";
  return prior
    .map((step) => {
      const title = getProfileStepCopy(profile, step).title;
      const summary = summarizeProfileStepForSuggestions(profile, step);
      return `${title}：${summary}`;
    })
    .join("；");
}

function getStepConsolidateFocusHint(
  profile: WorkProfile,
  step: ProfileStepId,
): string | null {
  switch (step) {
    case "direction":
      return null;
    case "style":
      return formatStyleFieldFocus(profile);
    case "context":
      return "人设、场景、品牌等正向设定；须呼应已定方向与风格";
    case "sequence":
      return "内容顺序与节拍；须呼应方向、风格与已有设定";
    case "bounds":
      return "这件作品需避免的具体元素；须针对已定主题，不要泛泛禁忌";
    default:
      return null;
  }
}

function buildStepAnchorLines(
  profile: WorkProfile,
  activeStep: ProfileSetupStep,
): string[] {
  if (activeStep === "ready") {
    const prior = summarizePriorSteps(profile, "ready");
    if (prior === "（无）") return [];
    return [
      `- 已定方案摘要：${prior}`,
      "- 扩展向建议须在此基础上补细节或微调，禁止脱离主题",
    ];
  }

  const prior = summarizePriorSteps(profile, activeStep);
  const lines: string[] = [];
  if (prior !== "（无）") {
    lines.push(
      `- 前述已定（扩展向须紧扣，禁止泛泛套话）：${prior}`,
    );
  }

  const focusHint = getStepConsolidateFocusHint(profile, activeStep);
  if (focusHint) {
    lines.push(`- 本步侧重：${focusHint}`);
  }

  if (activeStep === "direction" && profile.direction.summary.trim()) {
    lines.push(
      `- 方向原文：「${profile.direction.summary.trim()}」— 扩展向须能直接看出是在说这件作品`,
    );
  }

  return lines;
}

function buildAdvanceGuidanceLines(
  profile: WorkProfile,
  nextStep: ProfileStepId | "ready",
): string[] {
  if (nextStep === "ready") {
    const prior = summarizePriorSteps(profile, "ready");
    return [
      "- 下一步引导向：用户会说「开始制作」或带具体侧重的开制说法",
      prior !== "（无）"
        ? `- 开制说法须紧扣已定方案：${prior}`
        : "- 开制说法须紧扣已定方案主题",
      "- 禁止：「方案好了帮我制作」「推进到制作」等元说明",
    ];
  }

  const copy = getProfileStepCopy(profile, nextStep);
  const prior = summarizePriorSteps(profile, nextStep);
  return [
    `- 下一步引导向：直接写「${copy.title}」的可发送内容（不是描述要填哪一步）`,
    prior !== "（无）"
      ? `- 引导向须紧扣前述：${prior}`
      : "- 引导向须紧扣已定方向主题",
    `- 引导向示例方向（须结合作品具体化，勿逐字复制）：${copy.suggestionExamples.join("；")}`,
    `- 引导向禁止：「推进到下一步」「帮我填${copy.title}」「${copy.title}定了…」等流程元说明`,
  ];
}

function buildSlotAnchorNote(
  slot: ProfileSetupSuggestionSlot,
  profile: WorkProfile,
): string {
  if (!slot.step) return "";

  if (slot.layer === "consolidate") {
    const prior = summarizePriorSteps(profile, slot.step);
    if (prior === "（无）") return "";

    const focusHint =
      slot.step !== "ready"
        ? getStepConsolidateFocusHint(profile, slot.step)
        : null;
    const focusNote = focusHint ? `；${focusHint}` : "";
    return ` — 紧扣前述：${prior}${focusNote}`;
  }

  if (slot.layer === "advance") {
    if (slot.step === "ready") {
      const prior = summarizePriorSteps(profile, "ready");
      return prior !== "（无）"
        ? ` — 说开始制作或开制说法，紧扣：${prior}`
        : " — 说开始制作，紧扣已定方案";
    }

    const copy = getProfileStepCopy(profile, slot.step);
    const prior = summarizePriorSteps(profile, slot.step);
    const priorNote = prior !== "（无）" ? `，紧扣：${prior}` : "";
    return ` — 直接写「${copy.title}」内容${priorNote}；禁止元说明`;
  }

  return "";
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
  return "direction";
}

/** 是否已有方案/成稿，需要区分「扩展当前状态」与「下一步引导」 */
export function hasSuggestionLayeredContext(
  profile: WorkProfile | undefined,
  options?: { hasPreview?: boolean },
): boolean {
  if (options?.hasPreview) return true;
  return !isProfileEmpty(profile);
}

/** 按当前推进步充实程度，动态分配两层条数 */
export function computeSuggestionLayerCounts(
  count: number,
  focus: ProfileSetupSuggestionFocus,
  layered: boolean,
): SuggestionLayerCounts {
  if (!layered || count < 1) {
    return { consolidate: 0, advance: count };
  }
  if (count === 1) {
    return { consolidate: 0, advance: 1 };
  }

  let advanceRatio = 0.25;
  if (focus.activeStatus === "empty") {
    advanceRatio = 0.35;
  } else if (focus.activeStatus === "partial") {
    advanceRatio = 0.25;
  } else if (focus.activeStatus === "filled") {
    advanceRatio = 0.2;
  }
  if (focus.activeStep === "ready") {
    advanceRatio = Math.max(advanceRatio, 0.25);
  }

  const advance = Math.max(
    1,
    Math.min(count - 1, Math.round(count * advanceRatio)),
  );
  return { consolidate: count - advance, advance };
}

function buildGuideOnlySlots(count: number): ProfileSetupSuggestionSlot[] {
  return Array.from({ length: count }, () => ({
    role: "navigate",
    layer: "advance",
  }));
}

function buildLayeredSlots(
  focus: ProfileSetupSuggestionFocus,
  profile: WorkProfile,
  count: number,
): ProfileSetupSuggestionSlot[] {
  const { consolidate, advance } = computeSuggestionLayerCounts(
    count,
    focus,
    true,
  );
  const consolidateStep = getConsolidationStep(focus, profile);
  const nextStep =
    focus.activeStep === "ready" ? "ready" : (focus.nextStep ?? "ready");

  const slots: ProfileSetupSuggestionSlot[] = [];
  for (let i = 0; i < consolidate; i += 1) {
    slots.push({
      role: "refine",
      step: consolidateStep,
      layer: "consolidate",
    });
  }
  for (let i = 0; i < advance; i += 1) {
    slots.push({ role: "navigate", step: nextStep, layer: "advance" });
  }
  return slots;
}

function buildSuggestionSlots(
  focus: ProfileSetupSuggestionFocus,
  profile: WorkProfile,
  count: number,
  layered: boolean,
): ProfileSetupSuggestionSlot[] {
  if (!layered) {
    return buildGuideOnlySlots(count);
  }
  return buildLayeredSlots(focus, profile, count);
}

export function buildProfileSetupSuggestionSlots(
  focus: ProfileSetupSuggestionFocus,
  count: number,
  profile?: WorkProfile,
  options?: { hasPreview?: boolean },
): ProfileSetupSuggestionSlot[] {
  const parsed = parseProfileJson(profile);
  const layered = hasSuggestionLayeredContext(parsed, options);
  return buildSuggestionSlots(focus, parsed, count, layered);
}

function applySuggestionSlots(
  suggestions: NextStepSuggestion[],
  slots: ProfileSetupSuggestionSlot[],
): NextStepSuggestion[] {
  return suggestions.map((item, index) => {
    const slot = slots[index];
    if (!slot) return item;
    return {
      ...item,
      role: slot.role,
      ...(slot.step ? { step: slot.step } : {}),
    };
  });
}

/** 按槽位覆盖 step/role，供前端分层展示 */
export function resolveProfileSetupSuggestionRoles(
  suggestions: NextStepSuggestion[],
  input: SuggestionContextInput,
): NextStepSuggestion[] {
  if (suggestions.length === 0) return suggestions;

  const profile = parseProfileJson(input.profile);
  const focus = buildProfileSetupSuggestionFocus({
    before: input.beforeProfile,
    after: profile,
  });
  const slots = buildProfileSetupSuggestionSlots(
    focus,
    suggestions.length,
    profile,
    { hasPreview: input.hasPreview },
  );

  return applySuggestionSlots(suggestions, slots);
}

export function splitProfileSetupSuggestionLayers(
  suggestions: NextStepSuggestion[],
  input: SuggestionContextInput,
): {
  consolidate: NextStepSuggestion[];
  advance: NextStepSuggestion[];
} | null {
  const profile = parseProfileJson(input.profile);
  const layered = hasSuggestionLayeredContext(profile, {
    hasPreview: input.hasPreview,
  });
  if (!layered || suggestions.length < 2) {
    return null;
  }

  const normalized = resolveProfileSetupSuggestionRoles(suggestions, input);
  const focus = buildProfileSetupSuggestionFocus({
    before: input.beforeProfile,
    after: profile,
  });
  const slots = buildProfileSetupSuggestionSlots(
    focus,
    normalized.length,
    profile,
    { hasPreview: input.hasPreview },
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

export function buildSuggestionLayerHint(
  focus: ProfileSetupSuggestionFocus,
  profile: WorkProfile | undefined,
  layerCounts: SuggestionLayerCounts,
  layered: boolean,
): string | undefined {
  if (!layered) return undefined;

  const parsed = parseProfileJson(profile);
  const { consolidate, advance } = layerCounts;

  if (focus.activeStep === "ready") {
    return `前 ${consolidate} 条补方案细节，后 ${advance} 条推进制作或发布`;
  }

  const activeTitle = getProfileStepCopy(parsed, focus.activeStep).title;
  return `前 ${consolidate} 条延伸「${activeTitle}」，后 ${advance} 条引导下一步`;
}

export function buildProfileSetupSuggestionHint(
  focus: ProfileSetupSuggestionFocus,
  profile: WorkProfile | undefined,
  layerCounts?: SuggestionLayerCounts,
  layered = true,
): string {
  const layeredHint =
    layerCounts &&
    buildSuggestionLayerHint(focus, profile, layerCounts, layered);
  if (layeredHint) return layeredHint;

  const parsed = parseProfileJson(profile);

  if (focus.activeStep === "ready") {
    return "方案已就绪 — 开始制作，或再补一项细节";
  }

  const activeLabel = formatStepLabel(parsed, focus.activeStep);
  const activeTitle = getProfileStepCopy(parsed, focus.activeStep).title;

  if (focus.activeStatus === "empty") {
    return `当前「${activeTitle}」— 点一条继续，或直接输入`;
  }

  return `${activeLabel} — 点一条继续，或直接输入`;
}

export function buildProfileSetupSuggestionPromptBlock(
  focus: ProfileSetupSuggestionFocus,
  profile: WorkProfile | undefined,
): string {
  const parsed = parseProfileJson(profile);
  const setup = getProfileSetupState(parsed);
  const activeMeta = setup.steps.find((step) => step.id === focus.activeStep);

  const lines = [
    "## 方案进度（生成建议时须对齐）",
    "- **扩展当前状态**：锚定当前推进步，给灵感、补全、微调；须紧扣前述已定内容，禁止泛泛套话",
    "- **下一步引导**：像用户直接说出下一步要填的**具体内容**（不是描述要填哪一步、不是流程元说明）",
    `- 当前推进步：${activeMeta ? `第 ${activeMeta.index} 步 · ${activeMeta.title}` : focus.activeStep}（${focus.activeStatus}）`,
  ];

  if (focus.activeStep !== "ready") {
    const copy = getProfileStepCopy(parsed, focus.activeStep);
    lines.push(`- 本步要填什么：${copy.hint}`);
    lines.push(
      `- 本步灵感方向参考（扩展向须落在此步，勿逐字复制）：${copy.suggestionExamples.join("；")}`,
    );
    lines.push(...buildStepAnchorLines(parsed, focus.activeStep));
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
    lines.push(...buildAdvanceGuidanceLines(parsed, focus.nextStep));
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

export function buildSuggestionSlotRecipe(
  focus: ProfileSetupSuggestionFocus,
  count: number,
  profile: WorkProfile | undefined,
  options?: { hasPreview?: boolean },
): string {
  const parsed = parseProfileJson(profile);
  const layered = hasSuggestionLayeredContext(parsed, options);
  const slots = buildProfileSetupSuggestionSlots(focus, count, parsed, options);
  const layerCounts = computeSuggestionLayerCounts(count, focus, layered);
  const layerLabels = {
    consolidate: "扩展当前状态",
    advance: "下一步引导",
  } as const;

  if (!layered) {
    return [
      "## 建议槽位配方（须逐条对应）",
      `- 全部为**下一步引导**（${count} 条）：根据作品标题、参考素材与上下文，给出可立刻动手的具体方向；互斥、可区分`,
      ...slots.map(
        (_, index) => `${index + 1}. [${layerLabels.advance}] role=navigate`,
      ),
    ].join("\n");
  }

  const lines = slots.map((slot, index) => {
    const stepTitle = slot.step
      ? getProfileStepCopy(parsed, slot.step).title
      : "（无步骤）";
    const anchorNote = buildSlotAnchorNote(slot, parsed);
    return `${index + 1}. [${layerLabels[slot.layer]}] role=${slot.role}${slot.step ? ` · step=${slot.step}（${stepTitle}）` : ""}${anchorNote}`;
  });

  return [
    "## 建议槽位配方（须逐条对应）",
    `- **扩展当前状态** ${layerCounts.consolidate} 条（refine）：锚定当前步，给灵感/补全/微调；紧扣前述已定内容`,
    `- **下一步引导** ${layerCounts.advance} 条（navigate）：直接写下一步的可发送内容；ready 时说开始制作；禁止流程元说明`,
    ...lines,
  ].join("\n");
}

export function buildProfileSetupSuggestionSlotRecipe(
  focus: ProfileSetupSuggestionFocus,
  count: number,
  profile: WorkProfile | undefined,
): string {
  return buildSuggestionSlotRecipe(focus, count, profile);
}
