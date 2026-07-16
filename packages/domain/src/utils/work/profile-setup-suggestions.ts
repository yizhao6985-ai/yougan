import { CONTENT_FORMATS } from "../../models/content-form/formats.js";
import type {
  ProfileSetupStep,
  ProfileStepId,
  WorkProfile,
} from "../../models/work/profile.js";
import type { WorkProduction } from "../../models/work/production.js";
import { parseProfileJson } from "./profile.js";
import {
  PROFILE_SETUP_FLOW,
  buildProfileSetupProgressOptions,
  getActiveProfileStep,
  getProfileSetupState,
  isProfileSetupReady,
  isProfileStepFilled,
  summarizeProfileStepForSuggestions,
} from "./profile-setup.js";
import { getProfileStepCopy, getStyleFieldsForProfile } from "./profile-step-copy.js";

const FORMAT_LABELS = Object.fromEntries(
  CONTENT_FORMATS.map((item) => [item.id, item.label]),
) as Record<(typeof CONTENT_FORMATS)[number]["id"], string>;

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

function getStepFocusHint(
  profile: WorkProfile,
  step: ProfileStepId,
): string | null {
  switch (step) {
    case "direction":
      return null;
    case "style":
      return formatStyleFieldFocus(profile);
    case "setting":
      return "品牌、人物、故事背景等固定信息；须呼应已定方向与风格";
    case "requirements":
      return "对成稿的期望（字数、结构顺序等）；须呼应方向、风格与背景";
    case "bounds":
      return "写清要避免的具体内容（如不要人脸、不要震惊体），用用户会直接说的话，禁止只写「边界」「禁忌」类空标签";
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
      "- 建议须在此基础上推进，禁止脱离主题",
    ];
  }

  const prior = summarizePriorSteps(profile, activeStep);
  const lines: string[] = [];
  if (prior !== "（无）") {
    lines.push(`- 前述已定（建议须紧扣，禁止泛泛套话）：${prior}`);
  }

  const focusHint = getStepFocusHint(profile, activeStep);
  if (focusHint) {
    lines.push(`- 本步侧重：${focusHint}`);
  }

  if (activeStep === "direction" && profile.direction.summary.trim()) {
    lines.push(
      `- 方向原文：「${profile.direction.summary.trim()}」— 建议须能直接看出是在说这件作品`,
    );
  }

  return lines;
}

function buildNextStepGuidanceLines(
  profile: WorkProfile,
  nextStep: ProfileStepId | "ready",
  options?: { omitSuggestionExamples?: boolean },
): string[] {
  if (nextStep === "ready") {
    const prior = summarizePriorSteps(profile, "ready");
    return [
      "- 可建议用户说「开始制作」或带具体侧重的开制说法",
      prior !== "（无）"
        ? `- 开制说法须紧扣已定方案：${prior}`
        : "- 开制说法须紧扣已定方案主题",
      "- 禁止：「方案好了帮我制作」「推进到制作」等元说明",
    ];
  }

  const copy = getProfileStepCopy(profile, nextStep);
  const prior = summarizePriorSteps(profile, nextStep);
  const lines = [
    `- 可直接写「${copy.title}」的可发送内容（不是描述要填哪一步）`,
    prior !== "（无）"
      ? `- 须紧扣前述：${prior}`
      : "- 须紧扣已定方向主题",
  ];
  if (
    !options?.omitSuggestionExamples &&
    copy.suggestionExamples.length > 0
  ) {
    lines.push(
      `- 示例方向（须结合作品具体化，勿逐字复制）：${copy.suggestionExamples.join("；")}`,
    );
  }
  lines.push(
    `- 禁止：「推进到下一步」「帮我填${copy.title}」「${copy.title}定了…」等流程元说明`,
  );
  return lines;
}

export function buildProfileSetupSuggestionFocus(input: {
  before: WorkProfile | undefined;
  after: WorkProfile | undefined;
  hasPreview?: boolean;
  production?: WorkProduction | null;
}): ProfileSetupSuggestionFocus {
  const afterProfile = parseProfileJson(input.after);
  const progressOptions = buildProfileSetupProgressOptions({
    profile: afterProfile,
    production: input.production,
    hasPreview: input.hasPreview,
  });
  const newlyFilledSteps = diffNewlyFilledProfileSteps(input.before, input.after);
  const activeStep = getActiveProfileStep(
    afterProfile,
    progressOptions.skippedSteps ?? [],
    progressOptions,
  );
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
    return "方案已就绪 — 点一条继续，或直接输入";
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
  options?: { omitSuggestionExamples?: boolean },
): string {
  const parsed = parseProfileJson(profile);
  const setup = getProfileSetupState(parsed);
  const activeMeta = setup.steps.find((step) => step.id === focus.activeStep);

  const format = parsed.direction.format;
  const lines = [
    "## 方案进度（生成建议时须对齐）",
    "- 建议均为**下一步**：像用户会发送的具体话；禁止栏目名/清单/预警类抽象标签与流程元说明",
    `- 当前推进步：${activeMeta ? `第 ${activeMeta.index} 步 · ${activeMeta.title}` : focus.activeStep}（${focus.activeStatus}）`,
  ];
  if (format) {
    const formatLabel = FORMAT_LABELS[format] ?? format;
    lines.push(
      `- **体裁锚定**：已定形式为「${formatLabel}」——每条建议必须服务本件${formatLabel}，禁止换成测评、探店、口播、插画等其它形态选题`,
    );
  }

  if (focus.activeStep !== "ready") {
    const copy = getProfileStepCopy(parsed, focus.activeStep);
    lines.push(`- 本步要填什么：${copy.hint}`);
    if (
      !options?.omitSuggestionExamples &&
      copy.suggestionExamples.length > 0
    ) {
      lines.push(
        `- 本步灵感方向参考（勿逐字复制）：${copy.suggestionExamples.join("；")}`,
      );
    }
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
    lines.push(
      ...buildNextStepGuidanceLines(parsed, focus.nextStep, {
        omitSuggestionExamples: options?.omitSuggestionExamples,
      }),
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
