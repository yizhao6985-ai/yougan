import { scene } from "@/lib/scene-styles";
import { cn } from "@/lib/utils";

export function PageFallback() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={cn(scene.app, "items-center justify-center")}
    >
      <div
        aria-hidden
        className="size-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
      />
      <span className="sr-only">加载中</span>
    </div>
  );
}
