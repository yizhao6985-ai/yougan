import type { WorkProduction } from "../../models/work/production.js";
import type { WorkPreview } from "../../models/work/preview.js";
import {
  PROFILE_STEP_IDS,
  type ProfileSetupStep,
  type ProfileStepId,
  type WorkProfile,
} from "../../models/work/profile.js";
import { normalizeProfileTextField, parseProfileJson } from "./profile.js";
import { previewHasContent } from "./preview.js";
import { getProfileStepCopy } from "./profile-step-copy.js";

export type ProfileStepStatus = "pending" | "active" | "done" | "skipped";

export type ProfileStepItemTier = "recommended" | "optional";

export type ProfileStepItem = {
  key: string;
  filled: boolean;
  tier: ProfileStepItemTier;
};

export type ProfileSetupStepState = {
  id: ProfileSetupStep;
  index: number;
  status: ProfileStepStatus;
  items: ProfileStepItem[];
  filled: boolean;
  title: string;
};

export type ProfileSetupState = {
  steps: ProfileSetupStepState[];
  activeStep: ProfileSetupStep;
  ready: boolean;
};

export type ProfileSetupStateOptions = {
  skippedSteps?: ProfileSetupStep[];
  /** 已有成稿或已进入制作时，当前步骤停在「方案就绪」 */
  lockAtReady?: boolean;
  /** 已有明确作品标题时，省略方案步通用示例，避免带偏选题 */
  omitSuggestionExamples?: boolean;
};

export const PROFILE_SETUP_FLOW = PROFILE_STEP_IDS;

function hasStyle(profile: WorkProfile): boolean {
  return Boolean(
    normalizeProfileTextField(profile.style?.verbal) ||
      normalizeProfileTextField(profile.style?.visual),
  );
}

export function isProfileSetupReady(profile: WorkProfile): boolean {
  return (
    Boolean(profile.direction.summary.trim()) &&
    Boolean(profile.direction.format)
  );
}

export function isProfileStepFilled(
  profile: WorkProfile,
  step: ProfileStepId,
): boolean {
  switch (step) {
    case "direction":
      return (
        Boolean(profile.direction.summary.trim()) &&
        Boolean(profile.direction.format)
      );
    case "style":
      return hasStyle(profile);
    case "setting":
      return profile.setting.length > 0;
    case "requirements":
      return profile.requirements.length > 0;
    case "bounds":
      return profile.bounds.length > 0;
    default:
      return false;
  }
}

export function summarizeProfileStepForSuggestions(
  profile: WorkProfile,
  step: ProfileStepId,
): string {
  switch (step) {
    case "direction": {
      const parts: string[] = [];
      if (profile.direction.summary.trim()) {
        parts.push(profile.direction.summary.trim());
      }
      if (profile.direction.format) {
        parts.push(`形式 ${profile.direction.format}`);
      }
      if (profile.direction.audience?.trim()) {
        parts.push(`受众 ${profile.direction.audience.trim()}`);
      }
      return parts.join("；") || "（空）";
    }
    case "style": {
      const parts: string[] = [];
      const verbal = normalizeProfileTextField(profile.style?.verbal);
      const visual = normalizeProfileTextField(profile.style?.visual);
      if (verbal) {
        parts.push(`文字 ${verbal}`);
      }
      if (visual) {
        parts.push(`画面 ${visual}`);
      }
      return parts.join("；") || "（空）";
    }
    case "setting":
      if (profile.setting.length === 0) return "（空）";
      return profile.setting
        .map((item) => item.spec.trim())
        .filter(Boolean)
        .slice(0, 3)
        .join("；");
    case "requirements":
      if (profile.requirements.length === 0) return "（空）";
      return profile.requirements
        .map((item) => item.spec.trim())
        .filter(Boolean)
        .slice(0, 3)
        .join(" → ");
    case "bounds":
      if (profile.bounds.length === 0) return "（空）";
      return profile.bounds
        .map((item) => item.spec.trim())
        .filter(Boolean)
        .slice(0, 3)
        .join("；");
    default:
      return "（空）";
  }
}

function buildStepItems(
  profile: WorkProfile,
  step: ProfileStepId,
): ProfileStepItem[] {
  switch (step) {
    case "direction":
      return [
        {
          key: "summary",
          filled: Boolean(profile.direction.summary.trim()),
          tier: "recommended",
        },
        {
          key: "format",
          filled: Boolean(profile.direction.format),
          tier: "recommended",
        },
        {
          key: "audience",
          filled: Boolean(profile.direction.audience?.trim()),
          tier: "recommended",
        },
      ];
    case "style":
      return [
        {
          key: "style",
          filled: hasStyle(profile),
          tier: "recommended",
        },
      ];
    case "setting":
      return [
        {
          key: "setting",
          filled: profile.setting.length > 0,
          tier: "optional",
        },
      ];
    case "requirements":
      return [
        {
          key: "requirements",
          filled: profile.requirements.length > 0,
          tier: "optional",
        },
      ];
    case "bounds":
      return [
        {
          key: "bounds",
          filled: profile.bounds.length > 0,
          tier: "optional",
        },
      ];
    default:
      return [];
  }
}

function getFurthestFilledStepIndex(
  profile: WorkProfile,
  skipped: ProfileSetupStep[],
): number {
  let furthest = -1;
  for (let i = 0; i < PROFILE_SETUP_FLOW.length; i += 1) {
    const step = PROFILE_SETUP_FLOW[i]!;
    if (skipped.includes(step)) continue;
    if (isProfileStepFilled(profile, step)) {
      furthest = i;
    }
  }
  return furthest;
}

/** 作品已进入制作或已有成稿时，方案向导停在「方案就绪」 */
export function resolveProfileSetupLockAtReady(input: {
  profile: WorkProfile | undefined;
  preview?: WorkPreview | null;
  production?: WorkProduction | null;
}): boolean {
  const profile = parseProfileJson(input.profile);
  if (!isProfileSetupReady(profile)) return false;
  if (previewHasContent(input.preview)) return true;
  return (input.production?.pending_tasks?.length ?? 0) > 0;
}

export function buildProfileSetupProgressOptions(input: {
  profile?: WorkProfile | undefined;
  preview?: WorkPreview | null;
  production?: WorkProduction | null;
  skippedSteps?: ProfileSetupStep[];
  lockAtReady?: boolean;
  hasPreview?: boolean;
}): ProfileSetupStateOptions {
  const profile = parseProfileJson(input.profile);
  return {
    skippedSteps: input.skippedSteps,
    lockAtReady:
      input.lockAtReady ??
      (input.hasPreview
        ? isProfileSetupReady(profile)
        : resolveProfileSetupLockAtReady({
            profile,
            preview: input.preview,
            production: input.production,
          })),
  };
}

export function getActiveProfileStep(
  profile: WorkProfile,
  skippedSteps: ProfileSetupStep[] = [],
  options?: Pick<ProfileSetupStateOptions, "lockAtReady">,
): ProfileSetupStep {
  const skipped = skippedSteps;

  // 向导步骤均可后补；开制仍由 isProfileSetupReady（定位+体裁）门禁
  if (!isProfileSetupReady(profile)) {
    return "direction";
  }

  if (options?.lockAtReady) {
    return "ready";
  }

  const furthestIndex = getFurthestFilledStepIndex(profile, skipped);
  for (let i = furthestIndex + 1; i < PROFILE_SETUP_FLOW.length; i += 1) {
    const step = PROFILE_SETUP_FLOW[i]!;
    if (skipped.includes(step)) continue;
    if (!isProfileStepFilled(profile, step)) {
      return step;
    }
  }

  return "ready";
}

export function getProfileSetupState(
  raw: WorkProfile | undefined,
  options?: ProfileSetupStateOptions,
): ProfileSetupState {
  const profile = parseProfileJson(raw);
  const skipped = options?.skippedSteps ?? [];
  const activeStep = getActiveProfileStep(profile, skipped, options);
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
        items: buildStepItems(profile, id),
        filled,
        title: getProfileStepCopy(profile, id).title,
      };
    },
  );

  const lockedAtReady = Boolean(options?.lockAtReady && ready);

  const readyStep: ProfileSetupStepState = {
    id: "ready",
    index: PROFILE_SETUP_FLOW.length + 1,
    status: lockedAtReady
      ? "done"
      : activeStep === "ready"
        ? "active"
        : ready
          ? "done"
          : "pending",
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
  const readyStep = state.steps.find((step) => step.id === "ready");
  if (
    readyStep?.status === "done" &&
    state.activeStep === "ready" &&
    state.ready
  ) {
    return "制作方案已整理完成";
  }
  if (state.activeStep === "ready") {
    return "方案已就绪，可以说「开始制作」";
  }
  const active = state.steps.find((step) => step.id === state.activeStep);
  if (!active) return "整理制作方案中";
  if (!active.filled) {
    return `第 ${active.index} 步 · ${active.title}（建议补充）`;
  }
  return `第 ${active.index} 步 · ${active.title}`;
}

export function getProfileSetupStatusHint(
  raw: WorkProfile | undefined,
  options?: ProfileSetupStateOptions,
): string {
  const profile = parseProfileJson(raw);
  const state = getProfileSetupState(profile, options);
  const readyStep = state.steps.find((step) => step.id === "ready");
  if (
    readyStep?.status === "done" &&
    state.activeStep === "ready" &&
    state.ready
  ) {
    return "制作方案已整理完成";
  }
  if (state.activeStep === "ready") {
    return "制作方案已就绪，可说「开始制作」";
  }
  const copy = getProfileStepCopy(profile, state.activeStep);
  return `方案 · 第 ${state.steps.find((s) => s.id === state.activeStep)?.index ?? "?"} 步：${copy.title}`;
}

export function getProfileSetupPlaceholder(
  raw: WorkProfile | undefined,
  options?: ProfileSetupStateOptions,
): string {
  const profile = parseProfileJson(raw);
  const activeStep = getActiveProfileStep(
    profile,
    options?.skippedSteps ?? [],
    options,
  );
  return getProfileStepCopy(profile, activeStep).placeholder;
}

export function buildProfileStepPromptSection(
  raw: WorkProfile | undefined,
  options?: ProfileSetupStateOptions,
): string {
  const profile = parseProfileJson(raw);
  const state = getProfileSetupState(profile, options);
  const readyStep = state.steps.find((step) => step.id === "ready");
  const lockedAtReady = Boolean(
    options?.lockAtReady && state.ready && readyStep?.status === "done",
  );
  const copy = getProfileStepCopy(profile, state.activeStep);
  const stepMeta = state.steps.find((step) => step.id === state.activeStep);
  const completedTitles = PROFILE_SETUP_FLOW.filter((step) =>
    isProfileStepFilled(profile, step),
  ).map((step) => getProfileStepCopy(profile, step).title);

  const gaps = stepMeta?.items
    .filter((item) => !item.filled)
    .map((item) => item.key)
    .join("、");

  const lines = ["## 方案引导步骤"];

  if (lockedAtReady) {
    lines.push(
      "- 方案向导：已全部完成（已有成稿或已进入制作）",
      `- 方案就绪：${state.ready ? "是" : "否"}`,
    );
  } else {
    lines.push(
      `- 当前步骤：${stepMeta?.index ?? "?"} / ${PROFILE_SETUP_FLOW.length + 1} · ${copy.title}（${state.activeStep}）`,
      `- 本步目标：${copy.hint}`,
      `- 方案就绪：${state.ready ? "是" : "否"}`,
    );
  }

  if (completedTitles.length) {
    lines.push(`- 已完成步骤：${completedTitles.join("、")}`);
    const prior = PROFILE_SETUP_FLOW.filter((step) =>
      isProfileStepFilled(profile, step),
    )
      .map((step) => {
        const title = getProfileStepCopy(profile, step).title;
        const summary = summarizeProfileStepForSuggestions(profile, step);
        return summary !== "（空）" ? `${title}：${summary}` : title;
      })
      .join("；");
    if (prior) {
      lines.push(`- 已定方案摘要：${prior}`);
    }
  }
  if (gaps) {
    lines.push(`- 本步缺口：${gaps}`);
  }
  if (
    !options?.omitSuggestionExamples &&
    copy.suggestionExamples.length > 0
  ) {
    lines.push(
      `- 本步示例方向（勿逐字复制，须结合作品具体化）：${copy.suggestionExamples.join("；")}`,
    );
  }

  return lines.join("\n");
}

export function isProfileSetupPhase(
  raw: WorkProfile | undefined,
  options?: ProfileSetupStateOptions,
): boolean {
  const profile = parseProfileJson(raw);
  return getActiveProfileStep(profile, options?.skippedSteps ?? [], options) !== "ready";
}
