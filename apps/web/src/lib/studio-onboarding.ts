import { GUIDE_QUICK_START_STEPS, STUDIO_PANELS } from "@/lib/product-capabilities";
import { CREATIVE_CONTEXT_PANEL, STUDIO, STUDIO_ONBOARDING } from "@/lib/site-copy";

export const STUDIO_ONBOARDING_VERSION = "2026-06-v1";

export const STUDIO_ONBOARDING_TARGETS = {
  worksAside: "works-aside",
  chatArea: "chat-area",
  chatComposer: "chat-composer",
  creativePanel: "creative-panel",
  onboardingRevisit: "onboarding-revisit",
} as const;

export type StudioOnboardingTargetId =
  (typeof STUDIO_ONBOARDING_TARGETS)[keyof typeof STUDIO_ONBOARDING_TARGETS];

export type SpotlightPlacementPreference = "top" | "right" | "bottom" | "left";

export type StudioOnboardingStep =
  | {
      id: "welcome" | "finish";
      kind: "center";
      title: string;
      body: string;
      bullets?: readonly string[];
    }
  | {
      id: "works-aside" | "chat" | "creative-panel";
      kind: "spotlight";
      target: StudioOnboardingTargetId | StudioOnboardingTargetId[];
      fallbackTarget?: StudioOnboardingTargetId;
      title: string;
      body: string;
      bullets?: readonly string[];
      footnote?: string;
      ensureDrawerOpen?: boolean;
      placementPreference?: SpotlightPlacementPreference;
    };

export type StudioOnboardingRecord = {
  version: string;
  status: "completed" | "dismissed";
  dismissedAtStep?: number;
  updatedAt: string;
};

export function studioOnboardingStorageKey(userId: string) {
  return `yougan:studio-onboarding:${userId}`;
}

export function readStudioOnboardingRecord(
  userId: string,
): StudioOnboardingRecord | null {
  if (typeof localStorage === "undefined") return null;

  const raw = localStorage.getItem(studioOnboardingStorageKey(userId));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StudioOnboardingRecord;
    if (
      parsed &&
      typeof parsed.version === "string" &&
      (parsed.status === "completed" || parsed.status === "dismissed")
    ) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

export function writeStudioOnboardingRecord(
  userId: string,
  record: StudioOnboardingRecord,
) {
  localStorage.setItem(
    studioOnboardingStorageKey(userId),
    JSON.stringify(record),
  );
}

export function shouldAutoStartStudioOnboarding(userId: string) {
  const record = readStudioOnboardingRecord(userId);
  if (!record) return true;
  if (record.version !== STUDIO_ONBOARDING_VERSION) return true;
  return false;
}

const creativePanelTabIntros = (
  [
    ["profile", 1],
    ["preview", 2],
    ["history", 3],
  ] as const
).map(([tabKey, panelIndex]) => {
  const tab = CREATIVE_CONTEXT_PANEL.tabs[tabKey];
  const panel = STUDIO_PANELS[panelIndex]!;
  return `${tab}：${panel.body}`;
});

export const STUDIO_ONBOARDING_STEPS: StudioOnboardingStep[] = [
  {
    id: "welcome",
    kind: "center",
    title: STUDIO.worksSlogan,
    body: "接下来用约 30 秒带你认一遍创作台布局，并说明第一次创作怎么开始。",
  },
  {
    id: "works-aside",
    kind: "spotlight",
    target: STUDIO_ONBOARDING_TARGETS.worksAside,
    title: "作品列表",
    body: GUIDE_QUICK_START_STEPS[0]!.body,
    footnote: STUDIO_ONBOARDING.worksAsideRevisitFootnote,
    placementPreference: "right",
  },
  {
    id: "chat",
    kind: "spotlight",
    target: STUDIO_ONBOARDING_TARGETS.chatComposer,
    fallbackTarget: STUDIO_ONBOARDING_TARGETS.chatArea,
    title: STUDIO_PANELS[0]!.title,
    body: STUDIO_PANELS[0]!.body,
    placementPreference: "top",
  },
  {
    id: "creative-panel",
    kind: "spotlight",
    target: STUDIO_ONBOARDING_TARGETS.creativePanel,
    title: CREATIVE_CONTEXT_PANEL.title,
    body: "对话确认的内容会同步到这里，也可直接编辑。三个 Tab 分工如下：",
    bullets: creativePanelTabIntros,
    ensureDrawerOpen: true,
    placementPreference: "left",
  },
  {
    id: "finish",
    kind: "center",
    title: "下一步",
    body: "按这个顺序完成第一件作品：",
    bullets: GUIDE_QUICK_START_STEPS.slice(0, 3).map(
      (step) => `${step.title}：${step.body}`,
    ),
  },
];

export function resolveOnboardingTarget(
  target: StudioOnboardingTargetId | StudioOnboardingTargetId[],
  fallbackTarget?: StudioOnboardingTargetId,
) {
  const candidates = Array.isArray(target) ? target : [target];
  if (fallbackTarget) candidates.push(fallbackTarget);

  for (const id of candidates) {
    const element = document.querySelector<HTMLElement>(
      `[data-onboarding="${id}"]`,
    );
    if (element) return element;
  }

  return null;
}
