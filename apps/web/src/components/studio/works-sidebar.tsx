import { FolderPlusIcon, PlusIcon } from "lucide-react";

import { WorksGroupTree } from "@/components/studio/works-group-tree";
import { Button } from "@/components/ui/button";
import { useWorkItemNameDialog } from "@/hooks/use-work-item-name-dialog";
import { scene } from "@/lib/scene-styles";
import { STUDIO } from "@/lib/site-copy";

export function WorksSidebar() {
  const {
    dialog,
    openCreateWork,
    openCreateGroup,
    openRenameWork,
    openRenameGroup,
  } = useWorkItemNameDialog();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={scene.sidebarSection}>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => openCreateWork()}
        >
          <PlusIcon className="size-4" />
          {STUDIO.newWork}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => openCreateGroup()}
        >
          <FolderPlusIcon className="size-4" />
          {STUDIO.newGroup}
        </Button>
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
    </div>
  );
}
