import { cn } from "@/lib/utils";
import { scene } from "@/lib/scene-styles";

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-muted/80", className)}
      aria-hidden
    />
  );
}

export function DiscoverFeedSkeleton() {
  return (
    <div className="space-y-12" aria-busy aria-label="加载中">
      <div className="overflow-hidden rounded-2xl ring-1 ring-border/60">
        <div className="grid lg:grid-cols-2">
          <Bone className="aspect-[16/10] rounded-none lg:min-h-[22rem]" />
          <div className="space-y-4 p-8">
            <Bone className="h-3 w-20" />
            <Bone className="h-8 w-4/5" />
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-3/4" />
            <Bone className="mt-4 h-10 w-40" />
          </div>
        </div>
      </div>

      <div className={scene.contentGrid4}>
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <Bone className="aspect-[4/3] w-full rounded-xl" />
            <Bone className="h-3 w-16" />
            <Bone className="h-5 w-full" />
            <Bone className="h-4 w-2/3" />
            <Bone className="h-8 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}
