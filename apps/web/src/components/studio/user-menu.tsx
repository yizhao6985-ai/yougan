import {
  ChevronDownIcon,
  CircleUserRoundIcon,
  CrownIcon,
  ReceiptIcon,
  FolderKanbanIcon,
  KeyRoundIcon,
  LogOutIcon,
  MessageSquarePlusIcon,
  NewspaperIcon,
  UserRoundIcon,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuthorAvatar } from "@/components/content/author-avatar";
import { useLogoutMutation, useMeQuery } from "@/hooks/queries/auth";
import { BILLING, FEEDBACK, MEMBERSHIP, SETTINGS } from "@/lib/site-copy";
import type { AuthUser } from "@/services/auth";

type UserMenuItem = {
  to: string;
  label: string;
  icon: typeof CircleUserRoundIcon;
};

const USER_MENU_GROUPS: Array<{ label: string; items: UserMenuItem[] }> = [
  {
    label: SETTINGS.navGroups.account,
    items: [
      { to: "/settings/profile", label: "个人信息", icon: UserRoundIcon },
      { to: "/settings/account", label: "账户信息", icon: KeyRoundIcon },
    ],
  },
  {
    label: SETTINGS.navGroups.billing,
    items: [
      { to: "/settings/membership", label: MEMBERSHIP.navLabel, icon: CrownIcon },
      { to: "/settings/billing", label: BILLING.navLabel, icon: ReceiptIcon },
    ],
  },
  {
    label: SETTINGS.navGroups.content,
    items: [
      { to: "/settings/works", label: "作品管理", icon: FolderKanbanIcon },
      { to: "/settings/publications", label: "发布管理", icon: NewspaperIcon },
    ],
  },
];

function getDisplayName(user: AuthUser | null | undefined) {
  if (!user) return "用户";
  if (user.name?.trim()) return user.name.trim();
  return user.email.split("@")[0] || "用户";
}

export function UserMenu() {
  const navigate = useNavigate();
  const { data: user } = useMeQuery();
  const logoutMutation = useLogoutMutation();

  const displayName = getDisplayName(user);
  const author = user
    ? {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl ?? null,
      }
    : undefined;

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/login", { replace: true });
      },
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-11 min-w-[9.5rem] items-center gap-2 rounded-lg border border-border/80 bg-card/90 py-1.5 pl-1.5 pr-3 text-sm text-foreground/90 shadow-sm shadow-border/25 outline-none transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <AuthorAvatar author={author} size="sm" className="size-8" />
          <span className="min-w-[4.5rem] max-w-[7.5rem] flex-1 truncate text-left font-medium">
            {displayName}
          </span>
          <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground/70" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium text-foreground">
            {displayName}
          </p>
          {user?.email ? (
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to="/profile" className="cursor-pointer">
              <CircleUserRoundIcon />
              我的主页
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        {USER_MENU_GROUPS.map((group) => (
          <DropdownMenuGroup key={group.label}>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="px-2 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {group.label}
            </DropdownMenuLabel>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <DropdownMenuItem key={item.to} asChild>
                  <Link to={item.to} className="cursor-pointer">
                    <Icon />
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/feedback" className="cursor-pointer">
            <MessageSquarePlusIcon />
            {FEEDBACK.navLabel}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          onSelect={handleLogout}
        >
          <LogOutIcon />
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
