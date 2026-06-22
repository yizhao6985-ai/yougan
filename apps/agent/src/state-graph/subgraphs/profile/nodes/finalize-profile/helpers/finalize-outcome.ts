import {
  buildProfileSetupProgressOptions,
  getProfileSetupState,
  getProfileStepCopy,
  type WorkPreview,
  type WorkProduction,
  type WorkProfile,
} from "@yougan/domain";

type ProfileSection = "direction" | "style" | "setting" | "requirements" | "bounds";

const SECTION_LABELS: Record<ProfileSection, string> = {
  direction: "方向",
  style: "风格",
  setting: "背景",
  requirements: "需求",
  bounds: "边界",
};

const PROFILE_SECTIONS: ProfileSection[] = [
  "direction",
  "style",
  "setting",
  "requirements",
  "bounds",
];

function profileSectionChanged(
  before: WorkProfile,
  after: WorkProfile,
  section: ProfileSection,
): boolean {
  return JSON.stringify(before[section]) !== JSON.stringify(after[section]);
}

export function detectProfileChangedSections(
  before: WorkProfile,
  after: WorkProfile,
): ProfileSection[] {
  return PROFILE_SECTIONS.filter((section) =>
    profileSectionChanged(before, after, section),
  );
}

function buildStepHint(
  profile: WorkProfile,
  preview: WorkPreview | null,
  production: WorkProduction | null,
): string {
  const profileSetupOptions = buildProfileSetupProgressOptions({
    profile,
    preview,
    production,
  });
  const setup = getProfileSetupState(profile, profileSetupOptions);
  const step = setup.steps.find((item) => item.id === setup.activeStep);
  const stepCopy = getProfileStepCopy(profile, setup.activeStep);
  return `请在侧栏「制作方案」查看第 ${step?.index ?? "?"} 步 · ${stepCopy.title}`;
}

export function buildProfileFinalizeMessage(input: {
  before: WorkProfile;
  after: WorkProfile;
  preview?: WorkPreview | null;
  production?: WorkProduction | null;
}): string {
  const preview = input.preview ?? null;
  const production = input.production ?? null;
  const changed = detectProfileChangedSections(input.before, input.after);
  const stepHint = buildStepHint(input.after, preview, production);

  if (changed.length === 0) {
    return `作品方案暂无变更。${stepHint}。`;
  }

  const labels = changed.map((section) => SECTION_LABELS[section]);
  return `已更新${labels.join("、")}。${stepHint}。`;
}
