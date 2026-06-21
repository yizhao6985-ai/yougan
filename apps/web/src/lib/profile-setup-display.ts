import {
  buildProfileSetupProgressOptions,
  getActiveProfileStep,
  getProfileSetupHeadline,
  getProfileSetupPlaceholder,
  getProfileSetupState,
  getProfileSetupStatusHint,
  getProfileStepCopy,
  isProfileSetupPhase,
  mergeProfileForDisplay,
  parseProfileJson,
  type ProfileSetupState,
  type ProfileSetupStateOptions,
  type ProfileSetupStep,
  type TurnRuntime,
  type WorkPreview,
  type WorkProduction,
  type WorkProfile,
} from "@yougan/domain";

import { CHAT_COPY } from "@/lib/site-copy";

export type { ProfileSetupState, ProfileSetupStep };

export type ProfileSetupViewInput = ProfileSetupStateOptions & {
  preview?: WorkPreview | null;
  production?: WorkProduction | null;
};

type StreamProfileSource = {
  profile?: WorkProfile;
  turn?: TurnRuntime | null;
};

/** 合并作品缓存、已提交 checkpoint 与回合 staging，供聊天与侧栏共用 */
export function resolveStreamProfile(
  cached: WorkProfile | undefined,
  stream: StreamProfileSource | undefined,
): WorkProfile | undefined {
  const staging = stream?.turn?.staging;
  const hasPendingStaging = Boolean(
    staging && stream?.turn?.committed !== true,
  );
  if (hasPendingStaging) {
    let merged = mergeProfileForDisplay(cached, stream?.profile);
    return mergeProfileForDisplay(merged, staging?.profile) ?? merged;
  }

  // 无进行中 staging：作品物化列（含侧栏手改）优先于 checkpoint 里可能滞后的 profile
  if (cached != null) {
    return parseProfileJson(cached);
  }
  if (stream?.profile != null) {
    return parseProfileJson(stream.profile);
  }
  return undefined;
}

export function buildProfileSetupView(
  profile: WorkProfile | undefined,
  options?: ProfileSetupViewInput,
) {
  const normalized = parseProfileJson(profile);
  const progressOptions = buildProfileSetupProgressOptions({
    profile: normalized,
    preview: options?.preview,
    production: options?.production,
    skippedSteps: options?.skippedSteps,
    lockAtReady: options?.lockAtReady,
  });
  const state = getProfileSetupState(normalized, progressOptions);
  return {
    profile: normalized,
    state,
    activeStep: state.activeStep,
    headline: getProfileSetupHeadline(state),
    stepCopy: getProfileStepCopy(normalized, state.activeStep),
    ready: state.ready,
  };
}

export function profileSetupStatusHint(
  profile: WorkProfile | undefined,
  options?: ProfileSetupViewInput,
): string {
  const normalized = parseProfileJson(profile);
  const progressOptions = buildProfileSetupProgressOptions({
    profile: normalized,
    preview: options?.preview,
    production: options?.production,
    skippedSteps: options?.skippedSteps,
    lockAtReady: options?.lockAtReady,
  });
  return getProfileSetupStatusHint(normalized, progressOptions);
}

export function profileSetupPlaceholder(
  profile: WorkProfile | undefined,
  activeKind: string | null | undefined,
  options?: ProfileSetupViewInput,
): string {
  if (activeKind && activeKind !== "profile") {
    return CHAT_COPY.placeholderDefault;
  }
  const normalized = parseProfileJson(profile);
  const progressOptions = buildProfileSetupProgressOptions({
    profile: normalized,
    preview: options?.preview,
    production: options?.production,
    skippedSteps: options?.skippedSteps,
    lockAtReady: options?.lockAtReady,
  });
  if (!isProfileSetupPhase(normalized, progressOptions)) {
    return CHAT_COPY.placeholderDefault;
  }
  return getProfileSetupPlaceholder(normalized, progressOptions);
}

export { getActiveProfileStep, getProfileStepCopy, isProfileSetupPhase };
