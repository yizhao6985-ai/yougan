import { useCallback, useState } from "react";

import { ProfilePanel } from "@/components/profile-panel";
import { ContentPreview } from "@/components/content-preview";
import { ReferencePanel } from "@/components/reference-panel";
import { WorkHistoryPanel } from "@/components/studio/work-history-panel";
import { creativeContextPanelClassNames } from "@/components/studio/creative-context/shared";
import {
  UnderlineTabsList,
  UnderlineTabsPanel,
  UnderlineTabsTrigger,
} from "@/components/ui/underline-tabs";
import {
  CREATIVE_CONTEXT_PANEL,
  type CreativeContextTabId,
} from "@/lib/site-copy";
import { readStoredString, writeStoredString } from "@/lib/storage-value";
import type {
  Work,
  WorkPreview,
  WorkProduction,
  WorkProfile,
  WorkReference,
  WorkRevision,
} from "@/lib/types";

const TAB_ORDER: CreativeContextTabId[] = [
  "profile",
  "references",
  "preview",
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
  references?: WorkReference[];
  /** 创作轮廓（含 references） */
  profile?: WorkProfile;
  preview?: WorkPreview | null;
  production?: WorkProduction | null;
  revision?: WorkRevision | null;
  previewUnsaved?: boolean;
  onRemoveRevisionIntent?: (intentId: string) => void;
  enablePreviewSelection?: boolean;
  onDuplicated?: (workId: string) => void;
  onRestored?: (work: Work) => void | Promise<void>;
  onUpdateBound?: (itemId: string, spec: string) => void;
  onDeleteBound?: (itemId: string) => void;
  onClearBounds?: () => void;
  onUpdateRequirement?: (itemId: string, spec: string) => void;
  onDeleteRequirement?: (itemId: string) => void;
  onClearRequirements?: () => void;
  onUpdateSetting?: (itemId: string, spec: string) => void;
  onDeleteSetting?: (itemId: string) => void;
  onClearSetting?: () => void;
};

export function CreativeContextPanelContent({
  activeWork,
  references,
  profile,
  preview,
  production,
  revision,
  previewUnsaved,
  onRemoveRevisionIntent,
  enablePreviewSelection = false,
  onDuplicated,
  onRestored,
  onUpdateBound,
  onDeleteBound,
  onClearBounds,
  onUpdateRequirement,
  onDeleteRequirement,
  onClearRequirements,
  onUpdateSetting,
  onDeleteSetting,
  onClearSetting,
}: CreativeContextPanelContentProps) {
  const [activeTab, setActiveTab] = useState<CreativeContextTabId>(readStoredTab);

  const selectTab = useCallback((tab: CreativeContextTabId) => {
    setActiveTab(tab);
    writeStoredString(TAB_STORAGE_KEY, tab);
  }, []);

  return (
    <div className={creativeContextPanelClassNames.tabShell}>
      <UnderlineTabsList
        aria-label={CREATIVE_CONTEXT_PANEL.title}
        className={creativeContextPanelClassNames.tabList}
      >
        {TAB_ORDER.map((tabId) => {
          const selected = activeTab === tabId;
          const disabled = tabId === "history" && !activeWork;

          return (
            <UnderlineTabsTrigger
              key={tabId}
              active={selected}
              disabled={disabled}
              id={`creative-context-tab-${tabId}`}
              aria-controls={`creative-context-panel-${tabId}`}
              className={creativeContextPanelClassNames.tabTrigger}
              onClick={() => selectTab(tabId)}
            >
              {CREATIVE_CONTEXT_PANEL.tabs[tabId]}
            </UnderlineTabsTrigger>
          );
        })}
      </UnderlineTabsList>

      <div className={creativeContextPanelClassNames.tabPanel}>
        {activeTab === "profile" ? (
          <UnderlineTabsPanel
            id="creative-context-panel-profile"
            aria-labelledby="creative-context-tab-profile"
          >
            <ProfilePanel
              profile={profile}
              preview={preview}
              production={production}
              editable={Boolean(activeWork)}
              compact
              onUpdateBound={onUpdateBound}
              onDeleteBound={onDeleteBound}
              onClearBounds={onClearBounds}
              onUpdateRequirement={onUpdateRequirement}
              onDeleteRequirement={onDeleteRequirement}
              onClearRequirements={onClearRequirements}
              onUpdateSetting={onUpdateSetting}
              onDeleteSetting={onDeleteSetting}
              onClearSetting={onClearSetting}
            />
          </UnderlineTabsPanel>
        ) : null}

        {activeTab === "preview" ? (
          <UnderlineTabsPanel
            id="creative-context-panel-preview"
            aria-labelledby="creative-context-tab-preview"
          >
            <ContentPreview
              workId={activeWork?.id}
              preview={preview}
              revision={revision}
              unsaved={previewUnsaved}
              compact
              enablePreviewSelection={enablePreviewSelection}
              onRemoveRevisionIntent={onRemoveRevisionIntent}
            />
          </UnderlineTabsPanel>
        ) : null}

        {activeTab === "references" ? (
          <UnderlineTabsPanel
            id="creative-context-panel-references"
            aria-labelledby="creative-context-tab-references"
          >
            <ReferencePanel references={references} compact />
          </UnderlineTabsPanel>
        ) : null}

        {activeTab === "history" && activeWork ? (
          <UnderlineTabsPanel
            id="creative-context-panel-history"
            aria-labelledby="creative-context-tab-history"
          >
            <WorkHistoryPanel
              workId={activeWork.id}
              headVersionId={activeWork.headVersionId}
              onDuplicated={onDuplicated}
              onRestored={onRestored}
            />
          </UnderlineTabsPanel>
        ) : null}
      </div>
    </div>
  );
}
