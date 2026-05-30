import {
  ChevronRightIcon,
  FolderIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { organizeWorksByGroup } from "@/lib/works-organize";
import { cn } from "@/lib/utils";
import { useYouganStreamContext } from "@/components/studio/yougan-stream-provider";

type WorksGroupTreeProps = {
  mode: "sidebar" | "manage";
  onWorkSelect?: (workId: string) => void;
  onCreateWorkInGroup?: (groupId: string) => void;
  onRenameWork?: (workId: string, title: string) => void;
  onRenameGroup?: (groupId: string, title: string) => void;
};

function WorkRow({
  work,
  isActive,
  mode,
  onSelect,
  onDelete,
  onRename,
}: {
  work: { id: string; title: string; profile: { platform?: string | null } };
  isActive: boolean;
  mode: WorksGroupTreeProps["mode"];
  onSelect: () => void;
  onDelete: () => void;
  onRename?: () => void;
}) {
  if (mode === "manage") {
    return (
      <div
        className={cn(
          "group flex items-center gap-2 rounded-lg border px-3 py-2.5",
          isActive
            ? "border-primary/20 bg-accent/80"
            : "border-border/80 bg-card",
        )}
      >
        <button type="button" className="min-w-0 flex-1 text-left" onClick={onSelect}>
          <span className="block truncate text-sm font-medium text-foreground">
            {work.title}
          </span>
          {work.profile.platform ? (
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
              {work.profile.platform}
            </span>
          ) : null}
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="重命名作品"
            onClick={onRename}
          >
            <PencilIcon className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="删除作品"
            className="text-muted-foreground/70 hover:text-red-500"
            onClick={onDelete}
          >
            <Trash2Icon className="size-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative mb-1">
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "w-full rounded-lg px-3 py-2.5 pr-16 text-left text-sm transition",
          "hover:bg-accent",
          isActive && "bg-secondary/80 text-foreground",
        )}
      >
        <span className="block truncate font-medium text-foreground/90">
          {work.title}
        </span>
        {work.profile.platform ? (
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {work.profile.platform}
          </span>
        ) : null}
      </button>
      <div
        className={cn(
          "absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-0.5",
          "opacity-0 transition group-hover:opacity-100",
          isActive && "opacity-100",
        )}
      >
        <button
          type="button"
          aria-label="重命名作品"
          onClick={onRename}
          className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground/70 hover:bg-card hover:text-foreground/90"
        >
          <PencilIcon className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label="删除作品"
          onClick={onDelete}
          className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground/70 hover:bg-card hover:text-red-500"
        >
          <Trash2Icon className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

export function WorksGroupTree({
  mode,
  onWorkSelect,
  onCreateWorkInGroup,
  onRenameWork,
  onRenameGroup,
}: WorksGroupTreeProps) {
  const { works, groups, activeWork, selectWork, deleteWork, deleteGroup } =
    useYouganStreamContext();
  const { ungroupedWorks, groupedWorks } = organizeWorksByGroup(works, groups);

  const handleSelect = (workId: string) => {
    selectWork(workId);
    onWorkSelect?.(workId);
  };

  const renderWork = (work: (typeof works)[number]) => (
    <WorkRow
      key={work.id}
      work={work}
      isActive={activeWork?.id === work.id}
      mode={mode}
      onSelect={() => handleSelect(work.id)}
      onDelete={() => void deleteWork(work.id)}
      onRename={() => onRenameWork?.(work.id, work.title)}
    />
  );

  const empty =
    works.length === 0 && groups.length === 0 ? (
      <p
        className={cn(
          "text-muted-foreground",
          mode === "manage"
            ? "rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm"
            : "px-2 py-4 text-xs",
        )}
      >
        {mode === "manage"
          ? "还没有作品或分组，先创建一件开始创作吧。"
          : "创建第一件作品，开始持续完善创作内容。"}
      </p>
    ) : null;

  return (
    <div className={cn(mode === "manage" ? "space-y-4" : "space-y-3")}>
      {empty}

      {ungroupedWorks.length > 0 ? (
        <section className={mode === "manage" ? "space-y-2" : undefined}>
          {mode === "manage" && groups.length > 0 ? (
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
              未分组
            </p>
          ) : null}
          {mode === "manage" ? (
            <div className="space-y-2">{ungroupedWorks.map(renderWork)}</div>
          ) : (
            ungroupedWorks.map(renderWork)
          )}
        </section>
      ) : null}

      {groupedWorks.map(({ group, works: groupWorks }) => {
        const groupHeader =
          mode === "manage" ? (
            <div className="flex items-center gap-2 rounded-lg border border-border/80 bg-muted/80 px-3 py-2">
              <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {group.title}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="在分组下新建作品"
                  onClick={() => onCreateWorkInGroup?.(group.id)}
                >
                  <PlusIcon className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="重命名分组"
                  onClick={() => onRenameGroup?.(group.id, group.title)}
                >
                  <PencilIcon className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="删除分组"
                  className="text-muted-foreground/70 hover:text-red-500"
                  onClick={() => void deleteGroup(group.id)}
                >
                  <Trash2Icon className="size-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex w-full items-center gap-1 rounded-lg px-1 py-1 text-left hover:bg-muted">
              <CollapsibleTrigger className="flex min-w-0 flex-1 items-center gap-2">
                <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground/70 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm font-medium text-foreground/90">
                  {group.title}
                </span>
                <span className="text-xs text-muted-foreground/70">
                  {groupWorks.length}
                </span>
              </CollapsibleTrigger>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="重命名分组"
                onClick={() => onRenameGroup?.(group.id, group.title)}
              >
                <PencilIcon className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="在分组下新建作品"
                onClick={() => onCreateWorkInGroup?.(group.id)}
              >
                <PlusIcon className="size-3.5" />
              </Button>
            </div>
          );

        return (
          <Collapsible key={group.id} defaultOpen className="group/collapsible">
            {mode === "manage" ? (
              <div className="space-y-2">
                {groupHeader}
                <div className="space-y-2 pl-3">
                  {groupWorks.length === 0 ? (
                    <p className="px-2 py-2 text-xs text-muted-foreground/70">
                      分组下还没有作品
                    </p>
                  ) : (
                    groupWorks.map(renderWork)
                  )}
                </div>
              </div>
            ) : (
              <section>
                {groupHeader}
                <CollapsibleContent className="pl-2 pt-1">
                  {groupWorks.length === 0 ? (
                    <p className="px-2 py-2 text-xs text-muted-foreground/70">
                      分组下还没有作品
                    </p>
                  ) : (
                    groupWorks.map(renderWork)
                  )}
                </CollapsibleContent>
              </section>
            )}
          </Collapsible>
        );
      })}
    </div>
  );
}
