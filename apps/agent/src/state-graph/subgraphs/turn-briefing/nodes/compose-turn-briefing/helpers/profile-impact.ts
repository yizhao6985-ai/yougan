import {
  buildProfileSetupProgressOptions,
  getProfileSetupState,
  getProfileStepCopy,
  previewHasContent,
  type WorkPreview,
  type WorkProduction,
  type WorkProfile,
} from "@yougan/domain";

type ProfileSection = "direction" | "style" | "setting" | "requirements" | "bounds";

const SECTION_IMPACT: Record<ProfileSection, string> = {
  direction: "内容定位更明确，后续成稿主线会更清晰",
  style: "风格定下来后，文字与画面的表达会更统一",
  setting: "有了背景设定，成稿会更贴近你的具体语境",
  requirements: "创作要求越具体，成稿越贴近你的预期",
  bounds: "边界明确后，会少出现你不想要的表述",
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

export function buildProfileImpactLines(input: {
  before: WorkProfile;
  after: WorkProfile;
  preview: WorkPreview | null;
  production: WorkProduction | null;
}): string[] {
  const changed = detectProfileChangedSections(input.before, input.after);
  if (changed.length === 0) return [];

  const lines = changed.map((section) => SECTION_IMPACT[section]);

  const profileSetupOptions = buildProfileSetupProgressOptions({
    profile: input.after,
    preview: input.preview,
    production: input.production,
  });
  const setup = getProfileSetupState(input.after, profileSetupOptions);
  if (setup.activeStep !== "ready") {
    const stepCopy = getProfileStepCopy(input.after, setup.activeStep);
    lines.push(
      `「${stepCopy.title}」仍有关键缺口，若按现方案开写，成稿在该维度上可能偏泛`,
    );
  }

  if (previewHasContent(input.preview)) {
    lines.push("已有成稿不会随方案自动变化，要体现新方案需改稿或重新创作");
  }

  return lines;
}

export function profileTurnHadChanges(
  before: WorkProfile,
  after: WorkProfile,
): boolean {
  return detectProfileChangedSections(before, after).length > 0;
}
