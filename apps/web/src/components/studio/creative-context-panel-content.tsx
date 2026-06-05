import { useCallback, useState } from "react";

import { ProfilePanel } from "@/components/profile-panel";
import { ContentPreview } from "@/components/content-preview";
import { ReferencePanel } from "@/components/reference-panel";
import { WorkHistoryPanel } from "@/components/studio/work-history-panel";
import { creativeContextPanelClassNames } from "@/components/studio/creative-context/shared";
import {
  CREATIVE_CONTEXT_PANEL,
  type CreativeContextTabId,
} from "@/lib/site-copy";
import { readStoredString, writeStoredString } from "@/lib/storage-value";
import type { ReferenceItem, Work, WorkPreview, WorkProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

const TAB_ORDER: CreativeContextTabId[] = [
  "profile",
  "preview",
  "references",
  "history",
];

const TAB_STORAGE_KEY = "yougan:creative-context-tab";

function readStoredTab(): CreativeContextTabId {
  const raw = readStoredString(TAB_STORAGE_KEY);
  if (raw && TAB_ORDER.includes(raw as CreativeContextTabId)) {
    return raw as CreativeContextTabId;
  }
  return "profile";
}

type CreativeContextPanelContentProps = {
  activeWork: Work | null;
  references?: ReferenceItem[];
  /** 创作轮廓（含 references） */
  profile?: WorkProfile;
  preview?: WorkPreview | null;
  previewUnsaved?: boolean;
  onDuplicated?: (workId: string) => void;
  onUpdateConstraint?: (constraintId: string, description: string) => void;
  onDeleteConstraint?: (constraintId: string) => void;
  onClearConstraints?: () => void;
  onUpdateBeat?: (beatId: string, description: string) => void;
  onDeleteBeat?: (beatId: string) => void;
  onClearBeats?: () => void;
};

export function CreativeContextPanelContent({
  activeWork,
  references,
  profile,
  preview,
  previewUnsaved,
  onDuplicated,
  onUpdateConstraint,
  onDeleteConstraint,
  onClearConstraints,
  onUpdateBeat,
  onDeleteBeat,
  onClearBeats,
}: CreativeContextPanelContentProps) {
  const [activeTab, setActiveTab] = useState<CreativeContextTabId>(readStoredTab);

  const selectTab = useCallback((tab: CreativeContextTabId) => {
    setActiveTab(tab);
    writeStoredString(TAB_STORAGE_KEY, tab);
  }, []);

  return (
    <div className={creativeContextPanelClassNames.tabShell}>
      <div
        role="tablist"
        aria-label={CREATIVE_CONTEXT_PANEL.title}
        className={creativeContextPanelClassNames.tabList}
      >
        {TAB_ORDER.map((tabId) => {
          const selected = activeTab === tabId;
          return (
            <button
              key={tabId}
              type="button"
              role="tab"
              id={`creative-context-tab-${tabId}`}
              aria-selected={selected}
              aria-controls={`creative-context-panel-${tabId}`}
              className={cn(
                creativeContextPanelClassNames.tabTrigger,
                selected && creativeContextPanelClassNames.tabTriggerActive,
              )}
              onClick={() => selectTab(tabId)}
            >
              {CREATIVE_CONTEXT_PANEL.tabs[tabId]}
            </button>
          );
        })}
      </div>

      <div className={creativeContextPanelClassNames.tabPanel}>
        {activeTab === "profile" ? (
          <div
            role="tabpanel"
            id="creative-context-panel-profile"
            aria-labelledby="creative-context-tab-profile"
          >
            <ProfilePanel
              profile={profile}
              editable={Boolean(activeWork)}
              compact
              onUpdateConstraint={onUpdateConstraint}
              onDeleteConstraint={onDeleteConstraint}
              onClearConstraints={onClearConstraints}
              onUpdateBeat={onUpdateBeat}
              onDeleteBeat={onDeleteBeat}
              onClearBeats={onClearBeats}
            />
          </div>
        ) : null}

        {activeTab === "preview" ? (
          <div
            role="tabpanel"
            id="creative-context-panel-preview"
            aria-labelledby="creative-context-tab-preview"
          >
            <ContentPreview
              workId={activeWork?.id}
              preview={preview}
              unsaved={previewUnsaved}
              compact
            />
          </div>
        ) : null}

        {activeTab === "references" ? (
          <div
            role="tabpanel"
            id="creative-context-panel-references"
            aria-labelledby="creative-context-tab-references"
          >
            <ReferencePanel references={references} compact />
          </div>
        ) : null}

        {activeTab === "history" && activeWork ? (
          <div
            role="tabpanel"
            id="creative-context-panel-history"
            aria-labelledby="creative-context-tab-history"
          >
            <WorkHistoryPanel
              workId={activeWork.id}
              onDuplicated={onDuplicated}
              compact
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
