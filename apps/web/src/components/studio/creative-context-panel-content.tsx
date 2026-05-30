import { useCallback, useState } from "react";

import { ContentPreview } from "@/components/content-preview";
import { ContentSettingsPanel } from "@/components/content-settings-panel";
import { PlanPanel } from "@/components/plan-panel";
import { ReferencePanel } from "@/components/reference-panel";
import { creativeContextPanelClassNames } from "@/components/studio/creative-context/shared";
import {
  CREATIVE_CONTEXT_PANEL,
  type CreativeContextTabId,
} from "@/lib/site-copy";
import { readStoredString, writeStoredString } from "@/lib/storage-value";
import type { Work, WorkInspiration, WorkOutline, WorkProfile } from "@/lib/types";
import type { GeneratedContent } from "@/lib/types";
import { cn } from "@/lib/utils";

const TAB_ORDER: CreativeContextTabId[] = [
  "inspiration",
  "outline",
  "preview",
  "references",
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
  outline?: WorkOutline;
  inspiration?: WorkInspiration;
  creation?: GeneratedContent | null;
  onUpdateRequirement?: (requirementId: string, description: string) => void;
  onDeleteRequirement?: (requirementId: string) => void;
  onClearInspirations?: () => void;
};

export function CreativeContextPanelContent({
  activeWork,
  profile,
  outline,
  inspiration,
  creation,
  onUpdateRequirement,
  onDeleteRequirement,
  onClearInspirations,
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
              inspiration={inspiration}
              profile={profile}
              editable={activeWork?.mode === "inspiration"}
              compact
              onUpdateRequirement={onUpdateRequirement}
              onDeleteRequirement={onDeleteRequirement}
              onClearInspirations={onClearInspirations}
            />
          </div>
        ) : null}

        {activeTab === "outline" ? (
          <div
            role="tabpanel"
            id="creative-context-panel-outline"
            aria-labelledby="creative-context-tab-outline"
          >
            <PlanPanel outline={outline} compact />
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
              creation={creation}
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
      </div>
    </div>
  );
}
