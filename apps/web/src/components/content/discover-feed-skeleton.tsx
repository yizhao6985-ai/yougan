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
    <div className="space-y-10" aria-busy aria-label="加载中">
      <section>
        <Bone className="mb-3 h-4 w-16" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="w-[17.5rem] shrink-0 overflow-hidden rounded-xl ring-1 ring-border/60"
            >
              <Bone className="aspect-[4/3] w-full rounded-none" />
              <div className="space-y-2 p-4">
                <Bone className="h-3 w-12" />
                <Bone className="h-5 w-full" />
                <Bone className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className={scene.discoverFeedGrid}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-xl ring-1 ring-border/60"
          >
            <Bone className="aspect-[4/3] w-full rounded-none" />
            <div className="space-y-2 p-4">
              <Bone className="h-3 w-12" />
              <Bone className="h-5 w-full" />
              <Bone className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
