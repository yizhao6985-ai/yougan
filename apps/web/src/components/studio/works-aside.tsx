import { creativeContextPanelClassNames } from "@/components/studio/creative-context/shared";
import { WorksCreateMenu } from "@/components/studio/works-create-menu";
import { WorksGroupTree } from "@/components/studio/works-group-tree";
import { useWorkItemNameDialog } from "@/hooks/use-work-item-name-dialog";
import { STUDIO } from "@/lib/site-copy";

export function WorksAside() {
  const {
    dialog,
    openCreateWork,
    openCreateGroup,
    openRenameWork,
    openRenameGroup,
  } = useWorkItemNameDialog();

  return (
    <>
      <div className={creativeContextPanelClassNames.asideHeader}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={creativeContextPanelClassNames.asideTitle}>
              {STUDIO.worksTitle}
            </p>
            <p className={creativeContextPanelClassNames.asideHint}>
              {STUDIO.worksSlogan}
            </p>
          </div>
          <WorksCreateMenu
            onCreateWork={() => openCreateWork()}
            onCreateGroup={() => openCreateGroup()}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <WorksGroupTree
          mode="sidebar"
          onCreateWorkInGroup={(groupId) => openCreateWork(groupId)}
          onRenameWork={openRenameWork}
          onRenameGroup={openRenameGroup}
        />
      </div>

      {dialog}
    </>
  );
}
