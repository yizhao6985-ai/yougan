import { CreativeContextDrawer } from "@/components/studio/creative-context-drawer";
import { CreativeContextPanelContent } from "@/components/studio/creative-context-panel-content";
import { ComposerPreviewSelectionsProvider } from "@/components/studio/composer-preview-selections-context";
import { WorksAside } from "@/components/studio/works-aside";
import { YouganChat } from "@/components/studio/yougan-chat";
import { useYouganStreamContext } from "@/components/studio/yougan-stream-provider";
import { EMPTY_WORK_REVISION, mergeReferencesForDisplay } from "@yougan/domain";
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
    updateProfileRequirement,
    deleteProfileRequirement,
    clearWorkProfileRequirements,
    updateProfileSetting,
    deleteProfileSetting,
    clearWorkProfileSetting,
    removeRevisionIntentFromWork,
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
    staging?.preview ??
    streamValues?.preview ??
    activeWork?.preview ??
    null;
  const production =
    staging?.production ??
    streamValues?.production ??
    activeWork?.production ??
    null;
  const revision =
    staging?.revision ??
    streamValues?.revision ??
    activeWork?.revision ??
    EMPTY_WORK_REVISION;
  const previewUnsaved = Boolean(
    staging && streamValues?.turn?.committed !== true,
  );

  const panelContent = (
    <CreativeContextPanelContent
      activeWork={activeWork}
      references={references}
      profile={profile}
      preview={preview}
      production={production}
      revision={revision}
      previewUnsaved={previewUnsaved}
      onDuplicated={selectWork}
      onRestored={applyMaterializedWorkState}
      onRemoveRevisionIntent={
        activeWork
          ? (intentId) => removeRevisionIntentFromWork(activeWork.id, intentId)
          : undefined
      }
      enablePreviewSelection
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
      onUpdateRequirement={
        activeWork
          ? (itemId, spec) =>
              updateProfileRequirement(activeWork.id, itemId, spec)
          : undefined
      }
      onDeleteRequirement={
        activeWork
          ? (itemId) => deleteProfileRequirement(activeWork.id, itemId)
          : undefined
      }
      onClearRequirements={
        activeWork
          ? () => clearWorkProfileRequirements(activeWork.id)
          : undefined
      }
      onUpdateSetting={
        activeWork
          ? (itemId, spec) => updateProfileSetting(activeWork.id, itemId, spec)
          : undefined
      }
      onDeleteSetting={
        activeWork
          ? (itemId) => deleteProfileSetting(activeWork.id, itemId)
          : undefined
      }
      onClearSetting={
        activeWork ? () => clearWorkProfileSetting(activeWork.id) : undefined
      }
    />
  );

  return (
    <ComposerPreviewSelectionsProvider>
      <div className="grid h-full min-h-0 flex-1 overflow-hidden lg:grid-cols-[280px_minmax(0,1fr)_auto]">
        <aside
          data-onboarding="works-aside"
          className="hidden min-h-0 flex-col border-r border-border/80 bg-card/80 lg:flex"
        >
          <WorksAside />
        </aside>

        <div
          data-onboarding="chat-area"
          className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-gradient-to-b from-accent/35 to-background"
        >
          <YouganChat />
        </div>

        <CreativeContextDrawer>{panelContent}</CreativeContextDrawer>
      </div>
    </ComposerPreviewSelectionsProvider>
  );
}
