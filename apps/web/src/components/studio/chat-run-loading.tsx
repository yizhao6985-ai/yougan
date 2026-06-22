import { Shimmer } from "@/components/ai-elements/shimmer";
import { cn } from "@/lib/utils";

type ChatRunLoadingProps = {
  label: string;
  className?: string;
};

/** 对话底部运行中指示（粗步骤，与顶栏 statusHint 同源） */
export function ChatRunLoading({ label, className }: ChatRunLoadingProps) {
  return (
    <p
      className={cn("px-1 py-2 text-sm leading-6", className)}
      role="status"
      aria-live="polite"
    >
      <Shimmer className="text-muted-foreground">{label}</Shimmer>
    </p>
  );
}
