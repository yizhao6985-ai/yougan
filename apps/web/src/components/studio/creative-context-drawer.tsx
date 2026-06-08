import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { creativeContextPanelClassNames } from "@/components/studio/creative-context/shared";
import { CREATIVE_CONTEXT_PANEL } from "@/lib/site-copy";
import { readStoredString, writeStoredString } from "@/lib/storage-value";
import { cn } from "@/lib/utils";

const DRAWER_OPEN_KEY = "yougan:creative-context-drawer-open";
const DRAWER_WIDTH = "min(540px, 48vw)";

function readDrawerOpen(): boolean {
  const raw = readStoredString(DRAWER_OPEN_KEY);
  if (raw === "0") return false;
  if (raw === "1") return true;
  return true;
}

type CreativeContextDrawerProps = {
  header?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function CreativeContextDrawer({
  header,
  children,
  className,
}: CreativeContextDrawerProps) {
  const [open, setOpen] = useState(readDrawerOpen);

  const setOpenPersisted = useCallback((next: boolean) => {
    setOpen(next);
    writeStoredString(DRAWER_OPEN_KEY, next ? "1" : "0");
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        setOpenPersisted(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setOpenPersisted]);

  const defaultHeader = (
    <div className={creativeContextPanelClassNames.asideHeader}>
      <p className={creativeContextPanelClassNames.asideTitle}>
        {CREATIVE_CONTEXT_PANEL.title}
      </p>
      <p className={creativeContextPanelClassNames.asideHint}>
        {CREATIVE_CONTEXT_PANEL.hint}
      </p>
    </div>
  );

  return (
    <div
      className={cn("relative h-full min-h-0 shrink-0 overflow-visible", className)}
      style={{ width: open ? DRAWER_WIDTH : 0 }}
    >
      <button
        type="button"
        className={cn(
          "absolute top-1/2 z-50 flex h-14 w-5 -translate-y-1/2 items-center justify-center rounded-l-md border border-border/80 bg-card text-muted-foreground shadow-md transition hover:bg-muted hover:text-foreground",
          open
            ? "left-0 -translate-x-full border-r-0"
            : "right-0 border-r-0",
        )}
        aria-expanded={open}
        aria-label={
          open ? CREATIVE_CONTEXT_PANEL.collapse : CREATIVE_CONTEXT_PANEL.expand
        }
        onClick={() => setOpenPersisted(!open)}
      >
        {open ? (
          <ChevronRightIcon className="size-4 shrink-0" />
        ) : (
          <ChevronLeftIcon className="size-4 shrink-0" />
        )}
      </button>

      <aside
        aria-hidden={!open}
        className={cn(
          "flex h-full min-h-0 flex-col overflow-hidden border-l border-border/80 bg-card/95 shadow-sm transition-[opacity,transform] duration-300 ease-out",
          open
            ? "w-full translate-x-0 opacity-100"
            : "pointer-events-none w-full translate-x-full opacity-0",
        )}
      >
        {header ?? defaultHeader}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </aside>
    </div>
  );
}
