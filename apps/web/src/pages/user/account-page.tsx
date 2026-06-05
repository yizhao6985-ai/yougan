import { Link, Navigate, useParams } from "react-router-dom";

import {
  AccountContentTabs,
  AccountHero,
} from "@/components/account/account-hero";
import { AccountStatsPanel } from "@/components/account/account-stats";
import { AccountPublicationGrid } from "@/components/account/account-publication-grid";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { useMeQuery } from "@/hooks/queries/auth";
import {
  useUserProfileQuery,
  useUserProfileStatsQuery,
  useUserPublicationsQuery,
} from "@/hooks/queries/users";
import { scene } from "@/lib/scene-styles";
import { DISCOVER_SECTION } from "@/lib/content-section";
import { ACCOUNT_PAGE } from "@/lib/site-copy";

export function AccountPage() {
  const { userId = "" } = useParams();
  const { data: me } = useMeQuery();
  const profileQuery = useUserProfileQuery(userId);
  const statsQuery = useUserProfileStatsQuery(userId);
  const publicationsQuery = useUserPublicationsQuery(userId);

  const account = profileQuery.data ?? null;
  const publications = publicationsQuery.data ?? [];
  const isOwnAccount = Boolean(me && account && me.id === account.id);
  const loading = profileQuery.isLoading || publicationsQuery.isLoading;
  const notFound = profileQuery.isError;

  return (
    <div className={scene.app}>
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">加载中…</p>
        ) : notFound || !account ? (
          <div className="rounded-lg border border-dashed border-border bg-card/80 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              {ACCOUNT_PAGE.notFound}
            </p>
            <Button type="button" className="mt-4" size="sm" asChild>
              <Link to="/content">{DISCOVER_SECTION.continueBrowse}</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            <AccountHero account={account} isOwnAccount={isOwnAccount} />

            {statsQuery.data ? (
              <AccountStatsPanel stats={statsQuery.data} />
            ) : null}

            {publicationsQuery.isError ? (
              <p className="text-sm text-red-600">
                {ACCOUNT_PAGE.loadError}
              </p>
            ) : publications.length > 0 ? (
              <section className="space-y-6">
                <AccountContentTabs publicationCount={publications.length} />
                <AccountPublicationGrid publications={publications} />
              </section>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}

export function MyAccountPage() {
  const { data: user, isLoading, isError } = useMeQuery();

  if (isLoading) {
    return (
      <div className={scene.app}>
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
          <p className="text-sm text-muted-foreground">加载中…</p>
        </main>
      </div>
    );
  }

  if (isError || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={`/user/${user.id}`} replace />;
}
