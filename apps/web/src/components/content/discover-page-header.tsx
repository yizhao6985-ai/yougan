import { DISCOVER_SECTION } from "@/lib/content-section";
import { MarketingPageHeader } from "@/components/marketing/marketing-page-layout";

type DiscoverPageHeaderProps = {
  total?: number;
  loading?: boolean;
};

export function DiscoverPageHeader({ total, loading }: DiscoverPageHeaderProps) {
  return (
    <MarketingPageHeader
      title={DISCOVER_SECTION.title}
      subtitle={DISCOVER_SECTION.description}
      meta={
        !loading && typeof total === "number" ? (
          <>
            共{" "}
            <span className="font-medium tabular-nums text-foreground">
              {total}
            </span>{" "}
            篇公开作品
          </>
        ) : undefined
      }
    />
  );
}
