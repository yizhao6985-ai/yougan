import { creativeContextPanelClassNames } from "@/components/studio/creative-context/shared";
import { CreativeContextDrawer } from "@/components/studio/creative-context-drawer";
import { CreativeContextPanelContent } from "@/components/studio/creative-context-panel-content";
import { WorksAside } from "@/components/studio/works-aside";
import { YouganChat } from "@/components/studio/yougan-chat";
import { useYouganStreamContext } from "@/components/studio/yougan-stream-provider";
import { mergeBlueprintForDisplay } from "@/lib/blueprint-merge";
import { CREATIVE_CONTEXT_PANEL } from "@/lib/site-copy";

export function StudioCreateView() {
  const {
    activeWork,
    stream,
    selectWork,
    updateBlueprintConstraint,
    deleteBlueprintConstraint,
    clearWorkBlueprintConstraints,
    updateBlueprintBeat,
    deleteBlueprintBeat,
    clearWorkBlueprintBeats,
  } = useYouganStreamContext();

  const profile = stream.values?.profile ?? activeWork?.profile;
  const blueprint = mergeBlueprintForDisplay(
    activeWork?.blueprint,
    stream.values?.blueprint,
  );
  const draft = activeWork?.draft ?? stream.values?.draft ?? null;

  const panelContent = (
    <CreativeContextPanelContent
      activeWork={activeWork}
      profile={profile}
      blueprint={blueprint}
      draft={draft}
      onDuplicated={selectWork}
      onUpdateConstraint={
        activeWork
          ? (constraintId, description) =>
              updateBlueprintConstraint(activeWork.id, constraintId, description)
          : undefined
      }
      onDeleteConstraint={
        activeWork
          ? (constraintId) =>
              deleteBlueprintConstraint(activeWork.id, constraintId)
          : undefined
      }
      onClearConstraints={
        activeWork
          ? () => clearWorkBlueprintConstraints(activeWork.id)
          : undefined
      }
      onUpdateBeat={
        activeWork
          ? (beatId, description) =>
              updateBlueprintBeat(activeWork.id, beatId, description)
          : undefined
      }
      onDeleteBeat={
        activeWork
          ? (beatId) => deleteBlueprintBeat(activeWork.id, beatId)
          : undefined
      }
      onClearBeats={
        activeWork ? () => clearWorkBlueprintBeats(activeWork.id) : undefined
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
