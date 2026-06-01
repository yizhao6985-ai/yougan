import { creativeContextPanelClassNames } from "@/components/studio/creative-context/shared";
import { CreativeContextDrawer } from "@/components/studio/creative-context-drawer";
import { CreativeContextPanelContent } from "@/components/studio/creative-context-panel-content";
import { WorksAside } from "@/components/studio/works-aside";
import { YouganChat } from "@/components/studio/yougan-chat";
import { useYouganStreamContext } from "@/components/studio/yougan-stream-provider";
import { mergeBriefForDisplay } from "@/lib/brief-merge";
import { CREATIVE_CONTEXT_PANEL } from "@/lib/site-copy";

export function StudioCreateView() {
  const {
    activeWork,
    stream,
    selectWork,
    updateBriefRequirement,
    deleteBriefRequirement,
    clearWorkBrief,
  } = useYouganStreamContext();

  const profile = stream.values?.profile ?? activeWork?.profile;
  const brief = mergeBriefForDisplay(activeWork?.brief, stream.values?.brief);
  const draft = activeWork?.draft ?? stream.values?.draft ?? null;

  const panelContent = (
    <CreativeContextPanelContent
      activeWork={activeWork}
      profile={profile}
      brief={brief}
      draft={draft}
      onDuplicated={selectWork}
      onUpdateRequirement={
        activeWork
          ? (requirementId, description) =>
              updateBriefRequirement(activeWork.id, requirementId, description)
          : undefined
      }
      onDeleteRequirement={
        activeWork
          ? (requirementId) =>
              deleteBriefRequirement(activeWork.id, requirementId)
          : undefined
      }
      onClearBrief={
        activeWork ? () => clearWorkBrief(activeWork.id) : undefined
      }
    />
  );

  return (
    <div className="grid h-full min-h-0 flex-1 overflow-hidden lg:grid-cols-[280px_minmax(0,1fr)_auto]">
      <aside className="hidden min-h-0 flex-col border-r border-border/80 bg-card/80 lg:flex">
        <WorksAside />
      </aside>

      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-gradient-to-b from-accent/35 to-background">
        <YouganChat />
      </div>

      <CreativeContextDrawer className="hidden min-h-0 overflow-visible lg:flex">
        {panelContent}
      </CreativeContextDrawer>

      <aside className="flex max-h-[min(42vh,400px)] min-h-0 flex-col border-t border-border/80 bg-card/95 lg:hidden">
        <div className={creativeContextPanelClassNames.asideHeader}>
          <p className={creativeContextPanelClassNames.asideTitle}>
            {CREATIVE_CONTEXT_PANEL.title}
          </p>
          <p className={creativeContextPanelClassNames.asideHint}>
            {CREATIVE_CONTEXT_PANEL.hint}
          </p>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {panelContent}
        </div>
      </aside>
    </div>
  );
}
