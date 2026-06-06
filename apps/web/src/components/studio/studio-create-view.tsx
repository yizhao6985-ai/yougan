import { CreativeContextDrawer } from "@/components/studio/creative-context-drawer";
import { CreativeContextPanelContent } from "@/components/studio/creative-context-panel-content";
import { WorksAside } from "@/components/studio/works-aside";
import { YouganChat } from "@/components/studio/yougan-chat";
import { useYouganStreamContext } from "@/components/studio/yougan-stream-provider";
import { mergeProfileForDisplay } from "@yougan/domain";
export function StudioCreateView() {
  const {
    activeWork,
    stream,
    selectWork,
    updateProfileConstraint,
    deleteProfileConstraint,
    clearWorkProfileConstraints,
    updateProfileBeat,
    deleteProfileBeat,
    clearWorkProfileBeats,
  } = useYouganStreamContext();

  const staging = stream.values?.staging;
  const hasPendingStaging = Boolean(
    staging && stream.values?.turnCommitted !== true,
  );
  // 无进行中的 staging 时以作品缓存为准，避免手动编辑（清空/删除）后被 thread 内陈旧 profile 覆盖。
  const profile = hasPendingStaging
    ? mergeProfileForDisplay(activeWork?.profile, staging?.profile)
    : activeWork?.profile;
  const references = profile?.references ?? [];
  const preview =
    staging?.preview ??
    stream.values?.preview ??
    activeWork?.preview ??
    null;
  const previewUnsaved = Boolean(
    staging && stream.values?.turnCommitted !== true,
  );

  const panelContent = (
    <CreativeContextPanelContent
      activeWork={activeWork}
      references={references}
      profile={profile}
      preview={preview}
      previewUnsaved={previewUnsaved}
      onDuplicated={selectWork}
      onUpdateConstraint={
        activeWork
          ? (constraintId, description) =>
              updateProfileConstraint(activeWork.id, constraintId, description)
          : undefined
      }
      onDeleteConstraint={
        activeWork
          ? (constraintId) =>
              deleteProfileConstraint(activeWork.id, constraintId)
          : undefined
      }
      onClearConstraints={
        activeWork
          ? () => clearWorkProfileConstraints(activeWork.id)
          : undefined
      }
      onUpdateBeat={
        activeWork
          ? (beatId, description) =>
              updateProfileBeat(activeWork.id, beatId, description)
          : undefined
      }
      onDeleteBeat={
        activeWork
          ? (beatId) => deleteProfileBeat(activeWork.id, beatId)
          : undefined
      }
      onClearBeats={
        activeWork ? () => clearWorkProfileBeats(activeWork.id) : undefined
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
