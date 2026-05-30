import { Link, Navigate, useParams } from "react-router-dom";

import {
  ProfileContentTabs,
  UserProfileHero,
} from "@/components/profile/user-profile-hero";
import { UserProfileStatsPanel } from "@/components/profile/user-profile-stats";
import { ProfilePublicationGrid } from "@/components/profile/profile-publication-grid";
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
import { PROFILE_SECTION } from "@/lib/site-copy";

export function UserProfilePage() {
  const { userId = "" } = useParams();
  const { data: me } = useMeQuery();
  const profileQuery = useUserProfileQuery(userId);
  const statsQuery = useUserProfileStatsQuery(userId);
  const publicationsQuery = useUserPublicationsQuery(userId);

  const profile = profileQuery.data ?? null;
  const publications = publicationsQuery.data ?? [];
  const isOwnProfile = Boolean(me && profile && me.id === profile.id);
  const loading = profileQuery.isLoading || publicationsQuery.isLoading;
  const notFound = profileQuery.isError;

  return (
    <div className={scene.app}>
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">加载中…</p>
        ) : notFound || !profile ? (
          <div className="rounded-lg border border-dashed border-border bg-card/80 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              {PROFILE_SECTION.notFound}
            </p>
            <Button type="button" className="mt-4" size="sm" asChild>
              <Link to="/content">{DISCOVER_SECTION.continueBrowse}</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            <UserProfileHero profile={profile} isOwnProfile={isOwnProfile} />

            {statsQuery.data ? (
              <UserProfileStatsPanel stats={statsQuery.data} />
            ) : null}

            {publicationsQuery.isError ? (
              <p className="text-sm text-red-600">
                {PROFILE_SECTION.loadError}
              </p>
            ) : publications.length > 0 ? (
              <section className="space-y-6">
                <ProfileContentTabs publicationCount={publications.length} />
                <ProfilePublicationGrid publications={publications} />
              </section>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}

export function MyProfilePage() {
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
