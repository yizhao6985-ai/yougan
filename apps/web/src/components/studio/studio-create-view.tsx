import { CreativeContextDrawer } from "@/components/studio/creative-context-drawer";
import { CreativeContextPanelContent } from "@/components/studio/creative-context-panel-content";
import { WorksAside } from "@/components/studio/works-aside";
import { YouganChat } from "@/components/studio/yougan-chat";
import { useYouganStreamContext } from "@/components/studio/yougan-stream-provider";
import { mergeProfileForDisplay, mergeReferencesForDisplay } from "@yougan/domain";
export function StudioCreateView() {
  const {
    activeWork,
    stream,
    selectWork,
    updateProfileGuardrail,
    deleteProfileGuardrail,
    clearWorkProfileGuardrails,
    updateProfileSegment,
    deleteProfileSegment,
    clearWorkProfileSegments,
    updateProfileSetting,
    deleteProfileSetting,
    clearWorkProfileSettings,
  } = useYouganStreamContext();

  const streamValues = stream.values;
  const staging = streamValues?.turn?.staging;
  const hasPendingStaging = Boolean(
    staging && streamValues?.turn?.committed !== true,
  );
  const profile = hasPendingStaging
    ? mergeProfileForDisplay(activeWork?.profile, staging?.profile)
    : mergeProfileForDisplay(activeWork?.profile, streamValues?.profile);
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
      onUpdateGuardrail={
        activeWork
          ? (guardrailId, description) =>
              updateProfileGuardrail(activeWork.id, guardrailId, description)
          : undefined
      }
      onDeleteGuardrail={
        activeWork
          ? (guardrailId) =>
              deleteProfileGuardrail(activeWork.id, guardrailId)
          : undefined
      }
      onClearGuardrails={
        activeWork
          ? () => clearWorkProfileGuardrails(activeWork.id)
          : undefined
      }
      onUpdateSegment={
        activeWork
          ? (segmentId, description) =>
              updateProfileSegment(activeWork.id, segmentId, description)
          : undefined
      }
      onDeleteSegment={
        activeWork
          ? (segmentId) => deleteProfileSegment(activeWork.id, segmentId)
          : undefined
      }
      onClearSegments={
        activeWork ? () => clearWorkProfileSegments(activeWork.id) : undefined
      }
      onUpdateSetting={
        activeWork
          ? (settingId, description) =>
              updateProfileSetting(activeWork.id, settingId, description)
          : undefined
      }
      onDeleteSetting={
        activeWork
          ? (settingId) => deleteProfileSetting(activeWork.id, settingId)
          : undefined
      }
      onClearSettings={
        activeWork ? () => clearWorkProfileSettings(activeWork.id) : undefined
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
