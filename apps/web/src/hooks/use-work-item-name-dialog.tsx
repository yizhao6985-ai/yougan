import { useCallback, useMemo, useState } from "react";

import { WorkItemNameDialog } from "@/components/studio/work-item-name-dialog";
import { useYouganStreamContext } from "@/components/studio/yougan-stream-provider";

type DialogState =
  | { kind: "create-work"; groupId?: string | null }
  | { kind: "create-group" }
  | { kind: "rename-work"; id: string; initialTitle: string }
  | { kind: "rename-group"; id: string; initialTitle: string };

export function useWorkItemNameDialog() {
  const { createWork, createGroup, renameWork, renameGroup } =
    useYouganStreamContext();
  const [state, setState] = useState<DialogState | null>(null);

  const close = useCallback(() => setState(null), []);

  const openCreateWork = useCallback((groupId?: string | null) => {
    setState({ kind: "create-work", groupId });
  }, []);

  const openCreateGroup = useCallback(() => {
    setState({ kind: "create-group" });
  }, []);

  const openRenameWork = useCallback((id: string, initialTitle: string) => {
    setState({ kind: "rename-work", id, initialTitle });
  }, []);

  const openRenameGroup = useCallback((id: string, initialTitle: string) => {
    setState({ kind: "rename-group", id, initialTitle });
  }, []);

  const dialogConfig = useMemo(() => {
    if (!state) return null;

    switch (state.kind) {
      case "create-work":
        return {
          title: "新建作品",
          description: "为作品取一个名字，方便在侧边栏识别与管理。",
          placeholder: "作品名称",
          initialName: "",
          submitLabel: "创建",
          onSubmit: async (name: string) => {
            await createWork(name, state.groupId);
          },
        };
      case "create-group":
        return {
          title: "新建分组",
          description: "用分组组织相关作品，例如同一系列或同一制作方向。",
          placeholder: "分组名称",
          initialName: "",
          submitLabel: "创建",
          onSubmit: async (name: string) => {
            await createGroup(name);
          },
        };
      case "rename-work":
        return {
          title: "重命名作品",
          description: undefined,
          placeholder: "作品名称",
          initialName: state.initialTitle,
          submitLabel: "保存",
          onSubmit: async (name: string) => {
            await renameWork(state.id, name);
          },
        };
      case "rename-group":
        return {
          title: "重命名分组",
          description: undefined,
          placeholder: "分组名称",
          initialName: state.initialTitle,
          submitLabel: "保存",
          onSubmit: async (name: string) => {
            await renameGroup(state.id, name);
          },
        };
    }
  }, [state, createWork, createGroup, renameWork, renameGroup]);

  const dialog = dialogConfig ? (
    <WorkItemNameDialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
      {...dialogConfig}
    />
  ) : null;

  return {
    dialog,
    openCreateWork,
    openCreateGroup,
    openRenameWork,
    openRenameGroup,
  };
}
