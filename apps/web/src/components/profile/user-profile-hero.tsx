import { Link } from "react-router-dom";
import { PencilIcon } from "lucide-react";

import { AuthorAvatar } from "@/components/content/author-avatar";
import { Button } from "@/components/ui/button";
import { authorDisplayName } from "@/lib/publication-utils";
import { PROFILE_SECTION } from "@/lib/site-copy";
import { cn } from "@/lib/utils";

export type ProfileHeroData = {
  id: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  publicationCount: number;
};

function toAuthor(profile: ProfileHeroData) {
  return {
    id: profile.id,
    name: profile.name,
    email: "",
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
  };
}

export function UserProfileHero({
  profile,
  isOwnProfile,
}: {
  profile: ProfileHeroData;
  isOwnProfile: boolean;
}) {
  const author = toAuthor(profile);
  const displayName = authorDisplayName(author);

  return (
    <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm shadow-border/25">
      <div
        className={cn(
          "relative h-36 sm:h-44",
          !profile.coverUrl &&
            "bg-gradient-to-r from-primary/15 via-accent/80 to-secondary/70",
        )}
      >
        {profile.coverUrl ? (
          <img
            src={profile.coverUrl}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.35),transparent_55%)]" />
        )}
      </div>

      <div className="relative px-5 pb-6 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
            <AuthorAvatar
              author={author}
              size="lg"
              className={cn(
                "-mt-12 size-24 border-4 border-white text-3xl shadow-md sm:-mt-14 sm:size-28 sm:text-4xl",
              )}
            />

            <div className="min-w-0 pb-1">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {displayName}
              </h1>

              {profile.publicationCount > 0 ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground/90">
                    {PROFILE_SECTION.publicationCount(profile.publicationCount)}
                  </span>
                </div>
              ) : null}

              {profile.bio?.trim() ? (
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {profile.bio.trim()}
                </p>
              ) : isOwnProfile ? (
                <p className="mt-3 max-w-2xl text-sm text-muted-foreground/80">
                  还没有个人签名，可以在资料里补充一句介绍。
                </p>
              ) : null}
            </div>
          </div>

          {isOwnProfile ? (
            <div className="flex shrink-0 flex-wrap gap-2 sm:pb-1">
              <Button type="button" size="sm" variant="outline" asChild>
                <Link to="/settings/profile">
                  <PencilIcon className="size-4" />
                  {PROFILE_SECTION.editProfile}
                </Link>
              </Button>
              <Button type="button" size="sm" variant="ghost" asChild>
                <Link to="/settings/publications">发布管理</Link>
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function ProfileContentTabs({
  publicationCount,
}: {
  publicationCount: number;
}) {
  return (
    <div className="border-b border-border/80">
      <nav className="flex gap-6">
        <button
          type="button"
          className="relative -mb-px border-b-2 border-primary pb-3 text-sm font-medium text-foreground"
          aria-current="page"
        >
          {PROFILE_SECTION.publicationsHeading}
          {publicationCount > 0 ? (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              {publicationCount}
            </span>
          ) : null}
        </button>
      </nav>
    </div>
  );
}
