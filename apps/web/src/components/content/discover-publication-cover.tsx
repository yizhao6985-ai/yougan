import { cn } from "@/lib/utils";

const EMPTY_GRADIENT =
  "bg-gradient-to-br from-primary/10 via-accent/40 to-secondary/50";

type DiscoverCoverProps = {
  coverUrl: string | null;
  className?: string;
};

/** 发现页网格卡片顶图：4:3，随卡片列宽缩放 */
export function DiscoverFeedCover({
  coverUrl,
  className,
}: DiscoverCoverProps) {
  const url = coverUrl?.trim();

  return (
    <div
      className={cn(
        "relative aspect-[4/3] overflow-hidden bg-secondary/50",
        !url && EMPTY_GRADIENT,
        className,
      )}
    >
      {url ? (
        <>
          <img
            src={url}
            alt=""
            className="size-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        </>
      ) : null}
    </div>
  );
}
