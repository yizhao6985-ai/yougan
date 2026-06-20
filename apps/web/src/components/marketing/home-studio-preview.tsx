import {
  ImageIcon,
  ListTreeIcon,
  MessageSquareTextIcon,
  SparklesIcon,
} from "lucide-react";

import { scene } from "@/lib/scene-styles";
import { cn } from "@/lib/utils";

const WORK_ITEMS = ["春日随笔", "产品评测", "口播脚本"] as const;

const CHAT_LINES = [
  { role: "user" as const, text: "帮我写一篇关于城市漫步的随笔" },
  { role: "assistant" as const, text: "好的，我先整理制作方案：主题、体裁与结构。" },
] as const;

export function HomeStudioPreview() {
  return (
    <div
      aria-hidden
      className="relative mx-auto w-full max-w-xl lg:mx-0 lg:max-w-none"
    >
      <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-primary/15 via-transparent to-amber-200/20 blur-2xl dark:from-primary/10 dark:to-amber-900/15" />

      <div
        className={cn(
          scene.surface,
          "relative overflow-hidden shadow-xl shadow-black/8 dark:shadow-black/35",
        )}
      >
        <div className="flex items-center gap-2 border-b border-border/70 bg-secondary/40 px-4 py-3">
          <span className="size-2.5 rounded-full bg-rose-400/80" />
          <span className="size-2.5 rounded-full bg-amber-400/80" />
          <span className="size-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-2 text-xs font-medium text-muted-foreground">
            有感 · 创作台
          </span>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-primary">
            <SparklesIcon className="size-3" />
            制作中
          </span>
        </div>

        <div className="grid min-h-[17.5rem] grid-cols-[5.5rem_minmax(0,1fr)_7.5rem] sm:grid-cols-[6.5rem_minmax(0,1fr)_9rem]">
          <aside className="border-r border-border/60 bg-secondary/25 p-2.5">
            <p className="px-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              作品
            </p>
            <ul className="mt-2 space-y-1">
              {WORK_ITEMS.map((item, index) => (
                <li
                  key={item}
                  className={cn(
                    "truncate rounded-md px-2 py-1.5 text-[11px]",
                    index === 0
                      ? "bg-accent font-medium text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  {item}
                </li>
              ))}
            </ul>
          </aside>

          <div className="flex min-w-0 flex-col bg-gradient-to-b from-accent/20 to-background p-3">
            <div className="space-y-2">
              {CHAT_LINES.map((line) => (
                <div
                  key={line.text}
                  className={cn(
                    "max-w-[92%] rounded-lg px-2.5 py-2 text-[11px] leading-5",
                    line.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-card ring-1 ring-border/50 text-foreground",
                  )}
                >
                  {line.text}
                </div>
              ))}
            </div>

            <div className="mt-auto rounded-lg border border-border/70 bg-card/90 px-2.5 py-2">
              <div className="flex items-center gap-2">
                <MessageSquareTextIcon
                  className="size-3 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <span className="truncate text-[11px] text-muted-foreground">
                  继续补充要求，或说「开始制作」…
                </span>
              </div>
            </div>
          </div>

          <aside className="border-l border-border/60 bg-card/60 p-2.5">
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-1 text-[10px] font-medium text-primary">
                  <ListTreeIcon className="size-3" aria-hidden />
                  方案
                </div>
                <div className="mt-1.5 space-y-1 rounded-md bg-accent/40 p-2">
                  <div className="h-1.5 w-full rounded-full bg-primary/25" />
                  <div className="h-1.5 w-4/5 rounded-full bg-primary/15" />
                  <div className="h-1.5 w-3/5 rounded-full bg-primary/10" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1 text-[10px] font-medium text-primary">
                  <ImageIcon className="size-3" aria-hidden />
                  作品
                </div>
                <div className="mt-1.5 aspect-[4/3] rounded-md bg-gradient-to-br from-accent/50 via-card to-secondary/50 ring-1 ring-border/40" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
