import {
  PROFILE_STEP_IDS,
  type ProfileSetupStep,
  type ProfileStepId,
  type WorkProfile,
} from "../../models/work/profile.js";
import { parseProfileJson } from "./profile.js";
import { getProfileStepCopy } from "./profile-step-copy.js";

export type ProfileStepStatus = "pending" | "active" | "done" | "skipped";

export type ProfileStepItemTier = "required" | "recommended" | "optional";

export type ProfileStepItem = {
  key: string;
  filled: boolean;
  tier: ProfileStepItemTier;
};

export type ProfileSetupStepState = {
  id: ProfileSetupStep;
  index: number;
  status: ProfileStepStatus;
  required: boolean;
  items: ProfileStepItem[];
  filled: boolean;
  title: string;
};

export type ProfileSetupState = {
  steps: ProfileSetupStepState[];
  activeStep: ProfileSetupStep;
  ready: boolean;
};

export const PROFILE_SETUP_FLOW = PROFILE_STEP_IDS;

function hasExpression(profile: WorkProfile): boolean {
  const { expression } = profile;
  return Boolean(
    expression.audience?.trim() ||
      expression.verbal?.trim() ||
      expression.visual?.trim(),
  );
}

export function isProfileSetupReady(profile: WorkProfile): boolean {
  return (
    Boolean(profile.intent.summary.trim()) &&
    Boolean(profile.delivery.format) &&
    profile.delivery.modalities.length > 0
  );
}

export function isProfileStepFilled(
  profile: WorkProfile,
  step: ProfileStepId,
): boolean {
  switch (step) {
    case "intent":
      return Boolean(profile.intent.summary.trim());
    case "delivery":
      return Boolean(profile.delivery.format) && profile.delivery.modalities.length > 0;
    case "expression":
      return hasExpression(profile);
    case "structure":
      return (
        profile.structure.settings.length > 0 ||
        profile.structure.segments.length > 0
      );
    case "constraints":
      return profile.constraints.rules.length > 0;
    default:
      return false;
  }
}

function buildStepItems(
  profile: WorkProfile,
  step: ProfileStepId,
): ProfileStepItem[] {
  switch (step) {
    case "intent":
      return [
        {
          key: "summary",
          filled: Boolean(profile.intent.summary.trim()),
          tier: "required",
        },
      ];
    case "delivery":
      return [
        {
          key: "format",
          filled: Boolean(profile.delivery.format),
          tier: "required",
        },
        {
          key: "modalities",
          filled: profile.delivery.modalities.length > 0,
          tier: "required",
        },
      ];
    case "expression":
      return [
        {
          key: "expression",
          filled: hasExpression(profile),
          tier: "recommended",
        },
      ];
    case "structure":
      return [
        {
          key: "settings",
          filled: profile.structure.settings.length > 0,
          tier: "optional",
        },
        {
          key: "segments",
          filled: profile.structure.segments.length > 0,
          tier: "optional",
        },
      ];
    case "constraints":
      return [
        {
          key: "rules",
          filled: profile.constraints.rules.length > 0,
          tier: "optional",
        },
      ];
    default:
      return [];
  }
}

function stepIsRequired(step: ProfileStepId): boolean {
  return step === "intent" || step === "delivery";
}

export function getActiveProfileStep(
  profile: WorkProfile,
  skippedSteps: ProfileSetupStep[] = [],
): ProfileSetupStep {
  for (const step of PROFILE_SETUP_FLOW) {
    if (skippedSteps.includes(step)) continue;
    if (!isProfileStepFilled(profile, step)) {
      if (stepIsRequired(step)) return step;
      if (!isProfileSetupReady(profile)) continue;
      return step;
    }
  }
  return "ready";
}

export function getProfileSetupState(
  raw: WorkProfile | undefined,
  options?: { skippedSteps?: ProfileSetupStep[] },
): ProfileSetupState {
  const profile = parseProfileJson(raw);
  const skipped = options?.skippedSteps ?? [];
  const activeStep = getActiveProfileStep(profile, skipped);
  const ready = isProfileSetupReady(profile);

  const flowSteps: ProfileSetupStepState[] = PROFILE_SETUP_FLOW.map(
    (id, index) => {
      const filled = isProfileStepFilled(profile, id);
      const status: ProfileStepStatus = skipped.includes(id)
        ? "skipped"
        : id === activeStep
          ? "active"
          : filled
            ? "done"
            : "pending";
      return {
        id,
        index: index + 1,
        status,
        required: stepIsRequired(id),
        items: buildStepItems(profile, id),
        filled,
        title: getProfileStepCopy(profile, id).title,
      };
    },
  );

  const readyStep: ProfileSetupStepState = {
    id: "ready",
    index: PROFILE_SETUP_FLOW.length + 1,
    status: activeStep === "ready" ? "active" : ready ? "done" : "pending",
    required: false,
    items: [],
    filled: ready,
    title: getProfileStepCopy(profile, "ready").title,
  };

  return {
    steps: [...flowSteps, readyStep],
    activeStep,
    ready,
  };
}

export function getProfileSetupHeadline(state: ProfileSetupState): string {
  if (state.activeStep === "ready") {
    return "方案已就绪，可以说「开始制作」";
  }
  const active = state.steps.find((step) => step.id === state.activeStep);
  if (!active) return "整理制作方案中";
  if (active.required && !active.filled) {
    return `第 ${active.index} 步 · ${active.title}（必填）`;
  }
  if (!active.filled) {
    return `第 ${active.index} 步 · ${active.title}（建议补充）`;
  }
  return `第 ${active.index} 步 · ${active.title}`;
}

export function getProfileSetupStatusHint(
  raw: WorkProfile | undefined,
  skippedSteps: ProfileSetupStep[] = [],
): string {
  const profile = parseProfileJson(raw);
  const state = getProfileSetupState(profile, { skippedSteps });
  if (state.activeStep === "ready") {
    return "制作方案已就绪，可说「开始制作」";
  }
  const copy = getProfileStepCopy(profile, state.activeStep);
  return `方案 · 第 ${state.steps.find((s) => s.id === state.activeStep)?.index ?? "?"} 步：${copy.title}`;
}

export function getProfileSetupPlaceholder(
  raw: WorkProfile | undefined,
  skippedSteps: ProfileSetupStep[] = [],
): string {
  const profile = parseProfileJson(raw);
  const activeStep = getActiveProfileStep(profile, skippedSteps);
  return getProfileStepCopy(profile, activeStep).placeholder;
}

export function buildProfileStepPromptSection(raw: WorkProfile | undefined): string {
  const profile = parseProfileJson(raw);
  const state = getProfileSetupState(profile);
  const copy = getProfileStepCopy(profile, state.activeStep);
  const stepMeta = state.steps.find((step) => step.id === state.activeStep);
  const completedTitles = PROFILE_SETUP_FLOW.filter((step) =>
    isProfileStepFilled(profile, step),
  ).map((step) => getProfileStepCopy(profile, step).title);

  const gaps = stepMeta?.items
    .filter((item) => !item.filled)
    .map((item) => item.key)
    .join("、");

  const lines = [
    "## 方案引导步骤",
    `- 当前步骤：${stepMeta?.index ?? "?"} / ${PROFILE_SETUP_FLOW.length + 1} · ${copy.title}（${state.activeStep}）`,
    `- 本步目标：${copy.hint}`,
    `- 方案就绪：${state.ready ? "是" : "否"}`,
  ];

  if (completedTitles.length) {
    lines.push(`- 已完成步骤：${completedTitles.join("、")}`);
  }
  if (gaps) {
    lines.push(`- 本步缺口：${gaps}`);
  }
  lines.push(`- 本步示例方向（勿逐字复制，须结合作品具体化）：${copy.suggestionExamples.join("；")}`);

  return lines.join("\n");
}

export function isProfileSetupPhase(raw: WorkProfile | undefined): boolean {
  const profile = parseProfileJson(raw);
  return getActiveProfileStep(profile) !== "ready";
}
