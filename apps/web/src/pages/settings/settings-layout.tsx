import { Fragment, Suspense } from "react";
import { NavLink, Outlet } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  CrownIcon,
  FolderKanbanIcon,
  KeyRoundIcon,
  NewspaperIcon,
  MessageSquarePlusIcon,
  ReceiptIcon,
  UserRoundIcon,
} from "lucide-react";

import { OutletFallback } from "@/components/outlet-fallback";
import { MarketingPageHeader } from "@/components/marketing/marketing-page-layout";
import {
  SettingsPageBody,
  SettingsUserStrip,
} from "@/components/settings/settings-shell";
import { SiteHeader } from "@/components/site-header";
import { scene } from "@/lib/scene-styles";
import { BILLING, FEEDBACK, MEMBERSHIP, SETTINGS } from "@/lib/site-copy";
import { cn } from "@/lib/utils";

type SettingsNavItem = {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

const NAV_GROUPS: Array<{ label: string; items: SettingsNavItem[] }> = [
  {
    label: SETTINGS.navGroups.account,
    items: [
      {
        to: "/settings/profile",
        label: "个人信息",
        description: "昵称与个人签名",
        icon: UserRoundIcon,
      },
      {
        to: "/settings/account",
        label: "账户信息",
        description: "邮箱与登录密码",
        icon: KeyRoundIcon,
      },
    ],
  },
  {
    label: SETTINGS.navGroups.billing,
    items: [
      {
        to: "/settings/membership",
        label: MEMBERSHIP.navLabel,
        description: MEMBERSHIP.navDescription,
        icon: CrownIcon,
      },
      {
        to: "/settings/billing",
        label: BILLING.navLabel,
        description: BILLING.navDescription,
        icon: ReceiptIcon,
      },
    ],
  },
  {
    label: SETTINGS.navGroups.content,
    items: [
      {
        to: "/settings/works",
        label: "作品管理",
        description: "分组与作品列表",
        icon: FolderKanbanIcon,
      },
      {
        to: "/settings/publications",
        label: "发布管理",
        description: "草稿、发布与归档",
        icon: NewspaperIcon,
      },
    ],
  },
  {
    label: SETTINGS.navGroups.help,
    items: [
      {
        to: "/feedback",
        label: FEEDBACK.navLabel,
        description: FEEDBACK.navDescription,
        icon: MessageSquarePlusIcon,
      },
    ],
  },
];

function SettingsNavLink({ item }: { item: SettingsNavItem }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          scene.settingsNavLink,
          isActive ? scene.settingsNavLinkActive : scene.settingsNavLinkIdle,
        )
      }
    >
      <span className="inline-flex items-center gap-2.5 text-sm font-medium">
        <Icon className="size-4 shrink-0 text-primary/80" aria-hidden />
        {item.label}
      </span>
      <span className="mt-1 pl-[1.625rem] text-xs leading-5 text-muted-foreground">
        {item.description}
      </span>
    </NavLink>
  );
}

export function SettingsLayout() {
  return (
    <div className={scene.marketing}>
      <SiteHeader />

      <div className={cn(scene.settingsShell, scene.pageMainCompact)}>
        <MarketingPageHeader
          eyebrow={SETTINGS.sectionLabel}
          title="创作者中心"
          subtitle="管理个人资料、作品与发布内容，对外展示的主页会自动同步已发布作品。"
          wide
        />

        <div className="mt-8">
          <SettingsUserStrip />
        </div>

        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start">
          <aside className="lg:w-72 lg:shrink-0">
            <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-6 lg:overflow-visible lg:pb-0">
              {NAV_GROUPS.map((group, groupIndex) => (
                <Fragment key={group.label}>
                  {groupIndex > 0 ? (
                    <div
                      aria-hidden
                      className="mx-1 w-px shrink-0 self-stretch bg-border/60 lg:mx-0 lg:my-0 lg:h-px lg:w-auto"
                    />
                  ) : null}
                  <div className="flex shrink-0 flex-col gap-1 lg:shrink lg:gap-1.5">
                    <p className="hidden px-1 pb-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground lg:block">
                      {group.label}
                    </p>
                    <p className="rounded-full bg-secondary/70 px-2.5 py-1 text-[10px] font-medium text-muted-foreground lg:hidden">
                      {group.label}
                    </p>
                    {group.items.map((item) => (
                      <SettingsNavLink key={item.to} item={item} />
                    ))}
                  </div>
                </Fragment>
              ))}
            </nav>
          </aside>

          <main className="min-w-0 flex-1">
            <SettingsPageBody>
              <Suspense fallback={<OutletFallback />}>
                <Outlet />
              </Suspense>
            </SettingsPageBody>
          </main>
        </div>
      </div>
    </div>
  );
}
