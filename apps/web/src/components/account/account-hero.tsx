import { Link } from "react-router-dom";
import { PencilIcon } from "lucide-react";

import { AccountCover } from "@/components/account/account-cover";
import { AuthorAvatar } from "@/components/content/author-avatar";
import { Button } from "@/components/ui/button";
import { authorDisplayName } from "@/lib/publication-utils";
import { ACCOUNT_PAGE } from "@/lib/site-copy";
import { scene } from "@/lib/scene-styles";
import { cn } from "@/lib/utils";

export type AccountHeroData = {
  id: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  publicationCount: number;
};

function toAuthor(account: AccountHeroData) {
  return {
    id: account.id,
    name: account.name,
    email: "",
    bio: account.bio,
    avatarUrl: account.avatarUrl,
  };
}

export function AccountHero({
  account,
  isOwnAccount,
}: {
  account: AccountHeroData;
  isOwnAccount: boolean;
}) {
  const author = toAuthor(account);
  const displayName = authorDisplayName(author);

  return (
    <section className="overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm shadow-border/25">
      <AccountCover
        coverUrl={account.coverUrl}
        className="h-36 sm:h-44"
      />

      <div className="relative px-5 pb-6 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
            <AuthorAvatar
              author={author}
              size="lg"
              className={cn(
                scene.accountHeroAvatar,
                "-mt-12 size-24 border-4 border-white text-3xl shadow-md sm:-mt-14 sm:size-28 sm:text-4xl",
              )}
            />

            <div className="min-w-0 pb-1">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {displayName}
              </h1>

              {account.publicationCount > 0 ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-secondary px-3 py-1 text-xs font-medium text-foreground/90">
                    {ACCOUNT_PAGE.publicationCount(account.publicationCount)}
                  </span>
                </div>
              ) : null}

              {account.bio?.trim() ? (
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {account.bio.trim()}
                </p>
              ) : isOwnAccount ? (
                <p className="mt-3 max-w-2xl text-sm text-muted-foreground/80">
                  还没有个人签名，可以在资料里补充一句介绍。
                </p>
              ) : null}
            </div>
          </div>

          {isOwnAccount ? (
            <div className="flex shrink-0 flex-wrap gap-2 sm:pb-1">
              <Button type="button" size="sm" variant="outline" asChild>
                <Link to="/settings/profile">
                  <PencilIcon className="size-4" />
                  {ACCOUNT_PAGE.editProfile}
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

export function AccountContentTabs({
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
          {ACCOUNT_PAGE.publicationsHeading}
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
