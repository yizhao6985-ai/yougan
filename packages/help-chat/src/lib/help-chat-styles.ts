import { cn } from "./cn";

/** 与 web scene-styles / chatStreamBlock 对齐的客服窗样式 */
export const helpChatStyles = {
  overlay:
    "fixed inset-0 z-50 cursor-pointer bg-black/60 backdrop-blur-[2px] motion-safe:transition-opacity motion-safe:duration-200",
  shell: cn(
    "border border-border/80 bg-card/95 shadow-2xl shadow-black/10 ring-1 ring-border/50 backdrop-blur-md",
    "dark:border-border/70 dark:bg-card/90 dark:shadow-black/40",
  ),
  header: cn(
    "flex shrink-0 items-start justify-between gap-4 border-b border-border/80",
    "bg-card/85 px-5 py-4 backdrop-blur-md sm:px-6",
  ),
  headerIcon: cn(
    "flex size-10 shrink-0 items-center justify-center rounded-xl",
    "border border-primary/15 bg-primary/10 text-primary shadow-sm shadow-primary/10",
  ),
  headerTitle:
    "text-base font-semibold leading-6 tracking-tight text-foreground sm:text-lg",
  headerHint: "mt-0.5 text-sm leading-6 text-muted-foreground",
  iconButton: cn(
    "inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground",
    "transition-colors duration-200 hover:bg-muted/80 hover:text-foreground",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
  ),
  body: cn(
    "flex min-h-0 flex-1 flex-col overflow-y-auto",
    "bg-linear-to-b from-secondary/30 via-background to-background",
  ),
  messages:
    "mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6",
  userBubble: cn(
    "ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-primary/10 px-4 py-2.5",
    "text-sm leading-7 text-foreground shadow-sm shadow-primary/10",
    "ring-1 ring-primary/15",
  ),
  assistantBubble: cn(
    "w-full max-w-none rounded-2xl rounded-bl-md border border-border/80 bg-card px-4 py-3",
    "border-l-[3px] border-l-primary/35 text-sm leading-7 text-foreground/90",
    "shadow-sm shadow-border/15",
  ),
  assistantError: "border-destructive/30 bg-destructive/5 text-foreground",
  prose: cn(
    "prose prose-sm max-w-none prose-stone dark:prose-invert",
    "[&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
    "[&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5",
    "[&_strong]:font-semibold [&_a]:text-primary [&_a]:underline-offset-2",
  ),
  sourcesWrap: "mt-3 border-t border-border/60 pt-3",
  sourceChip: cn(
    "inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-muted/30",
    "px-2.5 py-1 text-xs leading-5 text-muted-foreground",
  ),
  emptyWrap: "flex flex-1 flex-col items-center justify-center px-6 py-8 sm:py-10",
  emptyIcon: cn(
    "flex size-14 items-center justify-center rounded-2xl",
    "border border-primary/15 bg-primary/10 text-primary shadow-sm shadow-primary/10",
  ),
  suggestionChip: cn(
    "group flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl",
    "border border-border/70 bg-card/90 px-4 py-3 text-left text-sm leading-6",
    "text-foreground/90 shadow-sm shadow-border/15 transition-[colors,box-shadow,border-color] duration-200",
    "hover:border-primary/30 hover:bg-accent/35 hover:shadow-md hover:shadow-primary/5",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ),
  suggestionChipHint:
    "size-4 shrink-0 text-muted-foreground/70 transition-colors duration-200 group-hover:text-primary",
  composerWrap: cn(
    "relative shrink-0 border-t border-border/80 bg-background/90 px-4 py-4 backdrop-blur-md sm:px-6",
  ),
  composerGradient:
    "pointer-events-none absolute inset-x-0 -top-8 h-8 bg-linear-to-t from-background/95 to-transparent",
  composerCard: cn(
    "flex items-end gap-2 rounded-xl border border-border/80 bg-card/95 p-2 shadow-lg shadow-border/20",
    "transition-[border-color,box-shadow] duration-200",
    "focus-within:border-ring/50 focus-within:ring-2 focus-within:ring-ring/20",
  ),
  composerInput: cn(
    "max-h-32 min-h-10 flex-1 resize-none border-0 bg-transparent px-2 py-2",
    "text-sm leading-6 text-foreground outline-none",
    "placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60",
  ),
  composerSubmit: cn(
    "inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-primary text-primary-foreground",
    "transition-colors duration-200 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
  ),
  composerHint: "mt-2 text-center text-xs text-muted-foreground",
  streamingDot: "inline-block size-1.5 animate-pulse rounded-full bg-primary/70",
} as const;
