import { Fragment } from "react";
import { NavLink, Outlet } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  CrownIcon,
  FolderKanbanIcon,
  KeyRoundIcon,
  NewspaperIcon,
  ReceiptIcon,
  Share2Icon,
  UserRoundIcon,
} from "lucide-react";

import {
  SettingsPageBody,
  SettingsUserStrip,
} from "@/components/settings/settings-shell";
import { SiteHeader } from "@/components/site-header";
import { scene } from "@/lib/scene-styles";
import { BILLING, MEMBERSHIP, SETTINGS } from "@/lib/site-copy";
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
    label: SETTINGS.navGroups.connect,
    items: [
      {
        to: "/settings/integrations",
        label: "平台集成",
        description: "第三方平台授权",
        icon: Share2Icon,
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
          "inline-flex min-w-[11rem] shrink-0 flex-col rounded-2xl border px-4 py-3 transition lg:min-w-0",
          isActive
            ? "border-primary/20 bg-card shadow-sm shadow-border/20"
            : "border-transparent bg-card/50 hover:border-border/80 hover:bg-card",
        )
      }
    >
      <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
        <Icon className="size-4 text-primary/80" />
        {item.label}
      </span>
      <span className="mt-1 pl-6 text-xs text-muted-foreground">{item.description}</span>
    </NavLink>
  );
}

export function SettingsLayout() {
  return (
    <div className={scene.app}>
      <SiteHeader />

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="space-y-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary/80">
              {SETTINGS.sectionLabel}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              创作者中心
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              管理个人资料、作品与发布内容，对外展示的主页会自动同步已发布作品。
            </p>
          </div>

          <SettingsUserStrip />

          <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
            <aside className="lg:w-64 lg:shrink-0">
              <nav className="flex items-stretch gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-0 lg:overflow-visible lg:pb-0">
                {NAV_GROUPS.map((group, groupIndex) => (
                  <Fragment key={group.label}>
                    {groupIndex > 0 ? (
                      <div
                        aria-hidden
                        className="mx-1 w-px shrink-0 self-stretch bg-border/80 lg:mx-0 lg:my-4 lg:h-px lg:w-auto"
                      />
                    ) : null}
                    <div className="flex shrink-0 gap-2 lg:shrink lg:flex-col lg:gap-1.5">
                      <p className="flex shrink-0 items-center self-center rounded-full bg-muted/70 px-2.5 py-1 text-[10px] font-medium text-muted-foreground lg:hidden">
                        {group.label}
                      </p>
                      <p className="hidden px-1 pb-0.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground lg:block">
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
                <Outlet />
              </SettingsPageBody>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
