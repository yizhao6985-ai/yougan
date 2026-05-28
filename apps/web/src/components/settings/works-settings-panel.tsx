import { FolderPlusIcon, PlusIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  SettingsPageHeader,
  SettingsPanelCard,
} from "@/components/settings/settings-shell";
import { WorksGroupTree } from "@/components/studio/works-group-tree";
import { Button } from "@/components/ui/button";
import { useWorkItemNameDialog } from "@/hooks/use-work-item-name-dialog";

export function WorksSettingsPanel() {
  const navigate = useNavigate();
  const {
    dialog,
    openCreateWork,
    openCreateGroup,
    openRenameWork,
    openRenameGroup,
  } = useWorkItemNameDialog();

  return (
    <div className="space-y-6">
      <SettingsPageHeader
        title="作品管理"
        description="用分组组织作品（如小说章节），组内创建与直接创建没有区别。"
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => openCreateWork()}
            >
              <PlusIcon className="size-4" />
              新建作品
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => openCreateGroup()}
            >
              <FolderPlusIcon className="size-4" />
              新建分组
            </Button>
          </>
        }
      />

      <SettingsPanelCard title="作品列表" description="点击作品可进入创作台继续编辑。">
        <WorksGroupTree
          mode="manage"
          onWorkSelect={() => navigate("/studio")}
          onCreateWorkInGroup={(groupId) => openCreateWork(groupId)}
          onRenameWork={openRenameWork}
          onRenameGroup={openRenameGroup}
        />
      </SettingsPanelCard>

      {dialog}
    </div>
  );
}
