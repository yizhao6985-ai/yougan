import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

/** 对话流内助手侧内容块（正文、工具、系统提示等）共用外观 */
export const chatStreamBlock = {
  root: cn(
    "w-full rounded-lg border border-border/80 bg-card px-4 py-3",
    "shadow-sm shadow-border/15",
  ),
  rootMuted: "bg-muted/25",
  stack: cn(
    "flex flex-col gap-3",
    "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
  ),
  body: "text-sm leading-7 text-foreground/90",
  muted: "text-sm leading-6 text-muted-foreground",
  caption: "text-xs leading-5 text-muted-foreground",
  divider: "border-t border-border/60 pt-3",
  header: "flex items-start gap-2.5",
  headerDot: "mt-1.5 size-2 shrink-0 rounded-md",
  headerTitle: "text-sm font-medium text-foreground",
  headerMeta: cn(
    "rounded-md px-2 py-0.5 text-[11px] font-medium",
    "bg-secondary text-muted-foreground",
  ),
  inset: cn(
    "rounded-lg border border-border/70 bg-muted/30 px-3 py-2.5",
    "text-sm leading-6 text-foreground/90 transition",
  ),
  insetInteractive: cn(
    "text-left hover:border-primary/25 hover:bg-accent/40",
    "disabled:cursor-not-allowed disabled:opacity-55",
  ),
  sectionLabel: cn(
    "text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80",
  ),
} as const;

type ChatStreamBlockProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** 系统提示等次要块使用略淡背景 */
  tone?: "default" | "muted";
};

export function ChatStreamBlock({
  children,
  className,
  tone = "default",
  ...props
}: ChatStreamBlockProps) {
  return (
    <div
      className={cn(
        chatStreamBlock.root,
        tone === "muted" && chatStreamBlock.rootMuted,
        className,
      )}
      {...props}
    >
      <div className={chatStreamBlock.stack}>{children}</div>
    </div>
  );
}
