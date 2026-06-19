import { CreativeContextDrawer } from "@/components/studio/creative-context-drawer";
import { CreativeContextPanelContent } from "@/components/studio/creative-context-panel-content";
import { WorksAside } from "@/components/studio/works-aside";
import { YouganChat } from "@/components/studio/yougan-chat";
import { useYouganStreamContext } from "@/components/studio/yougan-stream-provider";
import { mergeReferencesForDisplay } from "@yougan/domain";
import { resolveStreamProfile } from "@/lib/profile-setup-display";

export function StudioCreateView() {
  const {
    activeWork,
    stream,
    selectWork,
    applyMaterializedWorkState,
    updateProfileBound,
    deleteProfileBound,
    clearWorkProfileBounds,
    updateProfileSequence,
    deleteProfileSequence,
    clearWorkProfileSequence,
    updateProfileContext,
    deleteProfileContext,
    clearWorkProfileContext,
  } = useYouganStreamContext();

  const streamValues = stream.values;
  const staging = streamValues?.turn?.staging;
  const hasPendingStaging = Boolean(
    staging && streamValues?.turn?.committed !== true,
  );
  const profile = resolveStreamProfile(activeWork?.profile, streamValues);
  const references = hasPendingStaging
    ? mergeReferencesForDisplay(
        activeWork?.references,
        staging?.references ?? streamValues?.references,
      )
    : mergeReferencesForDisplay(
        activeWork?.references,
        streamValues?.references,
      );
  const preview =
    staging?.production?.preview ??
    streamValues?.production?.preview ??
    activeWork?.production?.preview ??
    null;
  const previewUnsaved = Boolean(
    staging && streamValues?.turn?.committed !== true,
  );

  const panelContent = (
    <CreativeContextPanelContent
      activeWork={activeWork}
      references={references}
      profile={profile}
      preview={preview}
      previewUnsaved={previewUnsaved}
      onDuplicated={selectWork}
      onRestored={applyMaterializedWorkState}
      onUpdateBound={
        activeWork
          ? (itemId, spec) => updateProfileBound(activeWork.id, itemId, spec)
          : undefined
      }
      onDeleteBound={
        activeWork
          ? (itemId) => deleteProfileBound(activeWork.id, itemId)
          : undefined
      }
      onClearBounds={
        activeWork ? () => clearWorkProfileBounds(activeWork.id) : undefined
      }
      onUpdateSequence={
        activeWork
          ? (itemId, spec) =>
              updateProfileSequence(activeWork.id, itemId, spec)
          : undefined
      }
      onDeleteSequence={
        activeWork
          ? (itemId) => deleteProfileSequence(activeWork.id, itemId)
          : undefined
      }
      onClearSequence={
        activeWork ? () => clearWorkProfileSequence(activeWork.id) : undefined
      }
      onUpdateContext={
        activeWork
          ? (itemId, spec) => updateProfileContext(activeWork.id, itemId, spec)
          : undefined
      }
      onDeleteContext={
        activeWork
          ? (itemId) => deleteProfileContext(activeWork.id, itemId)
          : undefined
      }
      onClearContext={
        activeWork ? () => clearWorkProfileContext(activeWork.id) : undefined
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

      <CreativeContextDrawer>{panelContent}</CreativeContextDrawer>
    </div>
  );
}
