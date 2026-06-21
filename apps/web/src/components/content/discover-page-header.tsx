import { DISCOVER_SECTION } from "@/lib/content-section";

type DiscoverPageHeaderProps = {
  total?: number;
  loading?: boolean;
};

export function DiscoverPageHeader({ total, loading }: DiscoverPageHeaderProps) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
          {DISCOVER_SECTION.title}
        </h1>
        <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
          {DISCOVER_SECTION.description}
        </p>
      </div>
      {!loading && typeof total === "number" ? (
        <p className="shrink-0 text-sm tabular-nums text-muted-foreground">
          共{" "}
          <span className="font-medium text-foreground">{total}</span> 篇
        </p>
      ) : null}
    </header>
  );
}
