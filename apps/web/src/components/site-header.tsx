import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowLeftIcon,
  Building2Icon,
  LayersIcon,
  MessageSquarePlusIcon,
  NewspaperIcon,
  SmartphoneIcon,
} from "lucide-react";

import { HelpChatWidget } from "@yougan/help-chat";

import { LocaleSelect } from "@/components/locale-select";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/studio/user-menu";
import { Button } from "@/components/ui/button";
import { useIsAuthenticated } from "@/store/auth";
import { DISCOVER_SECTION } from "@/lib/content-section";
import { scene } from "@/lib/scene-styles";
import { RAG_CHAT_API_URL } from "@/lib/env";
import { BRAND, NAV, SETTINGS } from "@/lib/site-copy";
import { cn } from "@/lib/utils";

function HeaderAuth() {
  const isLoggedIn = useIsAuthenticated();

  if (isLoggedIn) {
    return <UserMenu />;
  }

  return (
    <Button
      type="button"
      size="sm"
      className="h-10 shrink-0 px-4 md:h-11"
      asChild
    >
      <Link to="/login">{NAV.login}</Link>
    </Button>
  );
}

type NavItemProps = {
  to: string;
  active: boolean;
  label: string;
  shortLabel: string;
  icon: ReactNode;
};

function HeaderNavItem({ to, active, label, shortLabel, icon }: NavItemProps) {
  return (
    <Link
      to={to}
      className={cn(
        scene.headerNavLink,
        active ? scene.navActive : scene.navIdle,
      )}
      aria-current={active ? "page" : undefined}
      aria-label={label}
    >
      {icon}
      <span className="hidden md:inline lg:hidden">{shortLabel}</span>
      <span className="hidden lg:inline">{label}</span>
    </Link>
  );
}

export function SiteHeader() {
  const { pathname } = useLocation();
  const isSettings = pathname.startsWith("/settings");
  const isProfilePage =
    pathname === "/profile" || pathname.startsWith("/user/");
  const isAppContext =
    pathname.startsWith("/studio") ||
    pathname.startsWith("/content") ||
    isProfilePage;
  const onAboutPage = pathname === "/about";
  const onFeedbackPage = pathname === "/feedback";
  const onFeaturesPage = pathname === "/features";
  const onMobilePage = pathname === "/mobile";
  const onContentPage =
    pathname === "/content" || pathname.startsWith("/content/");
  const tagline = isAppContext ? BRAND.taglineApp : BRAND.taglineLanding;

  return (
    <header
      className={cn(
        scene.chrome,
        "flex min-h-16 items-center justify-between gap-4 lg:gap-10",
      )}
    >
      {isSettings ? (
        <div className="flex min-h-[3rem] items-center gap-4">
          <Link
            to="/studio"
            className={cn(
              "inline-flex items-center gap-1.5 text-sm transition",
              scene.navIdle,
            )}
          >
            <ArrowLeftIcon className="size-4" />
            {SETTINGS.backStudio}
          </Link>
          <div className="hidden h-4 w-px bg-border sm:block" />
          <Link
            to="/"
            className={cn(
              "hidden text-sm font-semibold tracking-tight sm:inline",
              scene.link,
            )}
          >
            {BRAND.full}
          </Link>
        </div>
      ) : (
        <Link
          to="/"
          className="group min-w-0 shrink rounded-md outline-none transition focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <p
            className={cn(
              "text-lg font-semibold leading-7 tracking-tight text-primary transition-colors",
              "group-hover:text-sky-700 dark:group-hover:text-sky-500",
            )}
          >
            {BRAND.full}
          </p>
          <p
            className={cn(
              "truncate text-sm leading-5 text-muted-foreground sm:whitespace-nowrap",
            )}
          >
            {tagline}
          </p>
        </Link>
      )}

      <nav className="flex min-w-0 items-center gap-2 sm:gap-3 lg:gap-4">
        {!isSettings ? (
          <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
            <HeaderNavItem
              to="/content"
              active={onContentPage}
              label={DISCOVER_SECTION.navLabel}
              shortLabel={DISCOVER_SECTION.navLabelShort}
              icon={<NewspaperIcon className="size-4 shrink-0" aria-hidden />}
            />
            <HeaderNavItem
              to="/features"
              active={onFeaturesPage}
              label={NAV.features}
              shortLabel={NAV.featuresShort}
              icon={<LayersIcon className="size-4 shrink-0" aria-hidden />}
            />
            <HeaderNavItem
              to="/mobile"
              active={onMobilePage}
              label={NAV.mobile}
              shortLabel={NAV.mobileShort}
              icon={<SmartphoneIcon className="size-4 shrink-0" aria-hidden />}
            />
            <HeaderNavItem
              to="/about"
              active={onAboutPage}
              label={NAV.about}
              shortLabel={NAV.aboutShort}
              icon={<Building2Icon className="size-4 shrink-0" aria-hidden />}
            />
            <HeaderNavItem
              to="/feedback"
              active={onFeedbackPage}
              label={NAV.feedback}
              shortLabel={NAV.feedbackShort}
              icon={
                <MessageSquarePlusIcon
                  className="size-4 shrink-0"
                  aria-hidden
                />
              }
            />
            <HelpChatWidget
              apiUrl={RAG_CHAT_API_URL}
              className={cn(scene.headerNavLink, scene.navIdle)}
            />
          </div>
        ) : null}

        {!isSettings ? (
          <div
            className="hidden h-9 w-px shrink-0 bg-border/80 sm:block"
            aria-hidden
          />
        ) : null}

        <div className="flex shrink-0 items-center gap-2 md:gap-2.5">
          <LocaleSelect />
          <ThemeToggle />
          <HeaderAuth />
        </div>
      </nav>
    </header>
  );
}
