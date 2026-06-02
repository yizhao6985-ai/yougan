import { useCallback, useState } from "react";

import { ContentPreview } from "@/components/content-preview";
import { ContentSettingsPanel } from "@/components/content-settings-panel";
import { OutlinePanel } from "@/components/outline-panel";
import { ReferencePanel } from "@/components/reference-panel";
import { WorkHistoryPanel } from "@/components/studio/work-history-panel";
import { creativeContextPanelClassNames } from "@/components/studio/creative-context/shared";
import {
  CREATIVE_CONTEXT_PANEL,
  type CreativeContextTabId,
} from "@/lib/site-copy";
import { readStoredString, writeStoredString } from "@/lib/storage-value";
import type { Work, WorkBrief, WorkDraft, WorkOutline, WorkProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

const TAB_ORDER: CreativeContextTabId[] = [
  "inspiration",
  "outline",
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
  return "inspiration";
}

type CreativeContextPanelContentProps = {
  activeWork: Work | null;
  profile?: WorkProfile;
  brief?: WorkBrief;
  outline?: WorkOutline;
  draft?: WorkDraft | null;
  onDuplicated?: (workId: string) => void;
  onUpdateRequirement?: (requirementId: string, description: string) => void;
  onDeleteRequirement?: (requirementId: string) => void;
  onClearBrief?: () => void;
  onUpdateSection?: (sectionId: string, description: string) => void;
  onDeleteSection?: (sectionId: string) => void;
  onClearOutline?: () => void;
};

export function CreativeContextPanelContent({
  activeWork,
  profile,
  brief,
  outline,
  draft,
  onDuplicated,
  onUpdateRequirement,
  onDeleteRequirement,
  onClearBrief,
  onUpdateSection,
  onDeleteSection,
  onClearOutline,
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
        {activeTab === "inspiration" ? (
          <div
            role="tabpanel"
            id="creative-context-panel-inspiration"
            aria-labelledby="creative-context-tab-inspiration"
          >
            <ContentSettingsPanel
              brief={brief}
              profile={profile}
              editable={Boolean(activeWork)}
              compact
              onUpdateRequirement={onUpdateRequirement}
              onDeleteRequirement={onDeleteRequirement}
              onClearBrief={onClearBrief}
            />
          </div>
        ) : null}

        {activeTab === "outline" ? (
          <div
            role="tabpanel"
            id="creative-context-panel-outline"
            aria-labelledby="creative-context-tab-outline"
          >
            <OutlinePanel
              outline={outline}
              editable={Boolean(activeWork)}
              compact
              onUpdateSection={onUpdateSection}
              onDeleteSection={onDeleteSection}
              onClearOutline={onClearOutline}
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
              draft={draft}
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
            <ReferencePanel references={profile?.references} compact />
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
              compact
              onDuplicated={onDuplicated}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
