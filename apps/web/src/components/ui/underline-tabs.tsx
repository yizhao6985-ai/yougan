import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function UnderlineTabsList({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex gap-6 overflow-x-auto overflow-y-visible border-b border-border/80 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      {...props}
    />
  );
}

export function UnderlineTabsTrigger({
  active = false,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & {
  active?: boolean;
}) {
  return (
    <button
      type={type}
      role="tab"
      aria-selected={active}
      className={cn(
        "relative shrink-0 pb-3 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2",
        active
          ? "font-medium text-foreground after:absolute after:inset-x-0 after:bottom-0 after:z-10 after:h-0.5 after:rounded-full after:bg-primary"
          : "font-normal text-muted-foreground hover:text-foreground",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function UnderlineTabsPanel({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      role="tabpanel"
      className={cn("outline-none", className)}
      {...props}
    />
  );
}
