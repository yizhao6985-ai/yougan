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

export function PublicationDetailSkeleton() {
  return (
    <div className={scene.articleColumn} aria-busy aria-label="加载中">
      <div className="space-y-5 sm:space-y-6">
        <Bone className="h-4 w-32" />
        <Bone className="h-12 w-full" />
        <Bone className="h-12 w-11/12" />
        <Bone className="h-6 w-4/5" />
        <div className="flex items-center gap-3">
          <Bone className="size-8 rounded-lg" />
          <Bone className="h-4 w-40" />
        </div>
      </div>

      <Bone className="mt-10 aspect-[16/10] w-full rounded-2xl sm:mt-12" />

      <div className="mt-10 space-y-3 sm:mt-12">
        {Array.from({ length: 6 }).map((_, index) => (
          <Bone key={index} className="h-4 w-full" />
        ))}
      </div>

      <Bone className="mt-12 h-24 w-full rounded-2xl sm:mt-14" />
    </div>
  );
}

export function PublicationRelatedSkeleton() {
  return (
    <div className={scene.contentGrid3}>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="space-y-3">
          <Bone className="aspect-[4/3] w-full rounded-xl" />
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}
