import {
  ChevronDownIcon,
  FileIcon,
  Loader2Icon,
  MusicIcon,
  VideoIcon,
  XIcon,
} from "lucide-react";
import { useRef, useState } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useComposerAttachmentsContext } from "@/components/studio/composer-attachments-context";
import type { ComposerAttachment } from "@/hooks/use-composer-attachments";
import { CHAT_COPY } from "@/lib/site-copy";
import { cn } from "@/lib/utils";

function AttachmentPreview({ item }: { item: ComposerAttachment }) {
  if (item.mediaKind === "image") {
    return (
      <img
        src={item.previewUrl}
        alt={item.filename}
        className={cn(
          "size-full object-cover",
          item.status === "error" && "opacity-40",
        )}
      />
    );
  }

  if (item.mediaKind === "video") {
    return (
      <video
        src={item.previewUrl}
        muted
        playsInline
        preload="metadata"
        className={cn(
          "size-full object-cover",
          item.status === "error" && "opacity-40",
        )}
      />
    );
  }

  const Icon =
    item.mediaKind === "audio" ? MusicIcon : FileIcon;

  return (
    <div
      className={cn(
        "flex size-full flex-col items-center justify-center gap-1 bg-muted/40 px-1 text-muted-foreground",
        item.status === "error" && "opacity-40",
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      <span className="line-clamp-2 w-full text-center text-[9px] leading-tight">
        {item.filename}
      </span>
    </div>
  );
}

export function ComposerAttachmentDrawer({ className }: { className?: string }) {
  const { items, remove } = useComposerAttachmentsContext();
  const [open, setOpen] = useState(true);
  const previousCountRef = useRef(items.length);

  if (items.length > previousCountRef.current) {
    previousCountRef.current = items.length;
    if (!open) {
      setOpen(true);
    }
  } else if (items.length !== previousCountRef.current) {
    previousCountRef.current = items.length;
  }

  if (items.length === 0) return null;

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      data-align="block-start"
      className={cn(
        "group/drawer w-full border-b border-border/60 bg-muted/20",
        className,
      )}
    >
      <div className="flex items-center gap-1 px-2 py-1.5 sm:px-3">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2 rounded-md py-0.5 text-left transition-colors hover:bg-muted/50"
            aria-expanded={open}
            aria-label={
              open
                ? CHAT_COPY.attachmentDrawer.collapse
                : CHAT_COPY.attachmentDrawer.expand
            }
          >
            <ChevronDownIcon
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                !open && "-rotate-180",
              )}
            />
            <span className="truncate text-xs font-medium text-muted-foreground">
              {CHAT_COPY.attachmentDrawer.title(items.length)}
            </span>
            {!open ? (
              <span className="truncate text-[11px] text-muted-foreground/70">
                {CHAT_COPY.attachmentDrawer.hint}
              </span>
            ) : null}
          </button>
        </CollapsibleTrigger>
        {open ? (
          <p className="hidden shrink-0 text-[11px] text-muted-foreground/80 sm:block">
            {CHAT_COPY.attachmentDrawer.hint}
          </p>
        ) : null}
      </div>

      <CollapsibleContent className="px-3 pb-2.5 pt-0">
        <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative size-16 shrink-0 overflow-hidden rounded-lg border border-border/70 bg-background shadow-sm"
            >
              <AttachmentPreview item={item} />
              {item.status === "uploading" ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                  <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
                </div>
              ) : null}
              {item.status === "error" ? (
                <div className="absolute inset-0 flex items-center justify-center bg-destructive/15 px-1 text-center text-[10px] leading-tight text-destructive">
                  失败
                </div>
              ) : null}
              <button
                type="button"
                aria-label={CHAT_COPY.attachmentDrawer.remove(item.filename)}
                onClick={() => remove(item.id)}
                className="absolute right-0.5 top-0.5 inline-flex size-5 items-center justify-center rounded-md bg-background/90 text-foreground/80 opacity-0 shadow-sm ring-1 ring-border/60 transition hover:bg-background hover:text-foreground group-hover:opacity-100"
              >
                <XIcon className="size-3" />
              </button>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
