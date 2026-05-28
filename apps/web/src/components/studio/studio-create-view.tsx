import { ContentPreview } from "@/components/content-preview";
import { ContentSettingsPanel } from "@/components/content-settings-panel";
import { PlanPanel } from "@/components/plan-panel";
import { ReferencePanel } from "@/components/reference-panel";
import { creativeContextPanelClassNames } from "@/components/studio/creative-context/shared";
import { YouganChat } from "@/components/studio/yougan-chat";
import {
  useYouganStreamContext,
} from "@/components/studio/yougan-stream-provider";
import { WorksSidebar } from "@/components/studio/works-sidebar";
import { mergeInspirationState } from "@/lib/inspiration-merge";
import { CREATIVE_CONTEXT_PANEL, STUDIO } from "@/lib/site-copy";

export function StudioCreateView() {
  const {
    activeWork,
    stream,
    updateInspirationRequirement,
    deleteInspirationRequirement,
    clearWorkInspirations,
  } = useYouganStreamContext();
  const profile = stream.values?.profile ?? activeWork?.profile;
  const outline = stream.values?.outline ?? activeWork?.outline;
  const inspiration = mergeInspirationState(
    activeWork?.inspiration,
    stream.values?.inspiration,
  );
  const creation = activeWork?.creation ?? stream.values?.creation;

  return (
    <div className="grid h-full min-h-0 flex-1 overflow-hidden lg:grid-cols-[220px_minmax(0,1.15fr)_minmax(320px,0.85fr)]">
      <aside className="hidden min-h-0 flex-col border-r border-border/80 bg-card/80 lg:flex">
        <div className="border-b border-border/80 px-4 py-3">
          <p className="text-sm font-medium text-foreground">{STUDIO.worksTitle}</p>
          <p className="text-xs text-muted-foreground">{STUDIO.worksHint}</p>
        </div>
        <WorksSidebar />
      </aside>

      <div className="flex min-h-0 flex-col overflow-hidden bg-gradient-to-b from-accent/35 to-background">
        <YouganChat />
      </div>

      <aside className="flex min-h-0 flex-col border-l border-border/80 bg-card/95">
        <div className={creativeContextPanelClassNames.asideHeader}>
          <p className={creativeContextPanelClassNames.asideTitle}>
            {CREATIVE_CONTEXT_PANEL.title}
          </p>
          <p className={creativeContextPanelClassNames.asideHint}>
            {CREATIVE_CONTEXT_PANEL.hint}
          </p>
        </div>
        <div className={creativeContextPanelClassNames.scrollArea}>
          <div className={creativeContextPanelClassNames.sections}>
            <ContentSettingsPanel
              inspiration={inspiration}
              profile={profile}
              editable={activeWork?.mode === "inspiration"}
              onUpdateRequirement={
                activeWork
                  ? (requirementId, description) =>
                      updateInspirationRequirement(
                        activeWork.id,
                        requirementId,
                        description,
                      )
                  : undefined
              }
              onDeleteRequirement={
                activeWork
                  ? (requirementId) =>
                      deleteInspirationRequirement(activeWork.id, requirementId)
                  : undefined
              }
              onClearInspirations={
                activeWork
                  ? () => clearWorkInspirations(activeWork.id)
                  : undefined
              }
            />
            <PlanPanel outline={outline} />
            <ContentPreview workId={activeWork?.id} creation={creation} />
            <ReferencePanel references={profile?.references} />
          </div>
        </div>
      </aside>
    </div>
  );
}
