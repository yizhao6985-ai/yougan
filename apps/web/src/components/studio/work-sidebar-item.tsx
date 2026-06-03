import {
  ChevronRightIcon,
  MessageSquarePlusIcon,
  MessagesSquareIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { useYouganStreamContext } from "@/components/studio/yougan-stream-provider";
import type { Work } from "@/lib/types";
import { STUDIO } from "@/lib/site-copy";
import { cn } from "@/lib/utils";

export function WorkSidebarItem({
  work,
  isActive,
  onRename,
  onDelete,
}: {
  work: Work;
  isActive: boolean;
  onRename?: () => void;
  onDelete: () => void;
}) {
  const {
    selectWork,
    conversations,
    activeConversation,
    conversationsLoading,
    selectConversation,
    createConversation,
    deleteConversation,
    stream,
  } = useYouganStreamContext();

  return (
    <Collapsible open={isActive} className="mb-1">
      <div
        className={cn(
          "group/work flex items-center rounded-lg transition",
          "hover:bg-accent",
          isActive && "bg-secondary/80",
        )}
      >
        <button
          type="button"
          onClick={() => selectWork(work.id)}
          className="flex min-w-0 flex-1 items-center gap-1.5 py-2 pl-1.5 text-left"
        >
          <ChevronRightIcon
            className={cn(
              "size-4 shrink-0 text-muted-foreground/70 transition-transform",
              isActive && "rotate-90",
            )}
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium leading-5 text-foreground/90">
              {work.title}
            </span>
            {work.profile.platform ? (
              <span className="mt-0.5 block truncate text-xs leading-4 text-muted-foreground">
                {work.profile.platform}
              </span>
            ) : null}
          </span>
        </button>
        <div
          className={cn(
            "flex shrink-0 items-center gap-0.5 pr-1",
            "opacity-0 transition group-hover/work:opacity-100",
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

      <CollapsibleContent className="space-y-0.5 pb-1 pl-3 pt-0.5">
        <button
          type="button"
          disabled={stream.isLoading}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium text-muted-foreground transition hover:bg-accent/70 hover:text-foreground"
          onClick={() => void createConversation()}
        >
          <MessageSquarePlusIcon className="size-3.5 shrink-0" />
          {STUDIO.newConversation}
        </button>

        {conversationsLoading && !conversations.length ? (
          <p className="px-2 py-1.5 text-xs text-muted-foreground">
            {STUDIO.conversationsLoading}
          </p>
        ) : null}

        {conversations.map((conversation) => {
          const selected = conversation.id === activeConversation?.id;
          return (
            <div
              key={conversation.id}
              className={cn(
                "group/conv relative flex items-center rounded-md pr-1 transition",
                selected
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
              )}
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 items-start gap-2 px-2 py-1.5 text-left"
                onClick={() => selectConversation(conversation.id)}
              >
                <MessagesSquareIcon
                  className={cn(
                    "mt-0.5 size-3.5 shrink-0",
                    selected ? "text-primary" : "text-muted-foreground/70",
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium">
                    {conversation.title}
                  </span>
                </span>
              </button>
              {conversations.length > 1 ? (
                <button
                  type="button"
                  aria-label="删除对话"
                  disabled={stream.isLoading}
                  className="inline-flex size-6 shrink-0 items-center justify-center rounded-md opacity-0 transition hover:bg-background/80 hover:text-destructive group-hover/conv:opacity-100"
                  onClick={() => void deleteConversation(conversation.id)}
                >
                  <Trash2Icon className="size-3" />
                </button>
              ) : null}
            </div>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}
