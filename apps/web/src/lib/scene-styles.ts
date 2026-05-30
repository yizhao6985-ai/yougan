/**
 * 有感 Yougan 场景样式（语义 token 见 index.css）
 */
export const scene = {
  marketing: "flex min-h-screen flex-col page-gradient",
  app: "flex min-h-screen flex-col bg-background",
  appShell: "flex h-screen flex-col overflow-hidden bg-background",

  chrome:
    "border-b border-border/80 bg-card/90 px-4 py-3.5 shadow-sm shadow-border/25 backdrop-blur sm:px-6 sm:py-4 lg:px-8",
  headerNavLink:
    "inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition md:h-11 md:px-3.5 lg:px-4",
  /** 对话区底部悬浮输入容器（透明渐变 + 绝对定位） */
  composer:
    "pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-background from-35% via-background/85 to-transparent px-4 pb-3 pt-12",
  /** 对话列表底部留白 / 回到底部按钮位置（需与 composer 总高度匹配） */
  conversationPadBottom: "pb-60",
  conversationScrollButton:
    "bottom-44 rounded-lg border-0 bg-card/95 text-primary shadow-lg shadow-primary/20 backdrop-blur-sm hover:bg-accent hover:text-primary hover:shadow-xl hover:shadow-primary/25 dark:bg-card/90 dark:shadow-black/35",
  /** 悬浮输入框卡片外观（作用于 PromptInput 内 InputGroup） */
  composerFloatingInput:
    "[&_[data-slot=input-group]]:overflow-hidden [&_[data-slot=input-group]]:rounded-lg [&_[data-slot=input-group]]:border-border/80 [&_[data-slot=input-group]]:bg-card/95 [&_[data-slot=input-group]]:shadow-lg [&_[data-slot=input-group]]:shadow-border/25 [&_[data-slot=input-group]]:backdrop-blur-sm [&_[data-slot=input-group]]:has-[[data-slot=input-group-control]:focus-visible]:ring-primary/20 [&_[data-slot=input-group]]:has-[[data-align=block-start]]:flex-col [&_[data-slot=input-group]]:has-[[data-align=block-start]]:items-stretch",
  /** 创作台各栏顶栏（中间对话区、右侧创作脉络等） */
  studioPanelHeader:
    "flex min-h-[4.75rem] shrink-0 flex-col justify-center border-b border-border/80 bg-card/70 px-4 py-3 backdrop-blur",
  studioPanelHeaderTitle: "font-medium leading-5 text-foreground",
  studioPanelHeaderHint:
    "line-clamp-2 text-xs leading-4 text-muted-foreground",

  sidebar: "border-border/80 bg-secondary/35",
  sidebarSection: "space-y-2 border-b border-border/80 p-3",

  card: "rounded-lg border border-border/80 bg-card/95 shadow-sm shadow-border/20 backdrop-blur",
  cardInteractive:
    "rounded-lg border border-border/80 bg-card/90 shadow-sm shadow-border/20 backdrop-blur transition hover:border-primary/20 hover:shadow-md",
  cardFlat:
    "rounded-lg border border-border/80 bg-card p-4 shadow-sm shadow-border/15",
  cardPadding: "p-6",

  panel: "rounded-lg border border-border/70 bg-card/80 p-4 shadow-sm",
  panelInset:
    "rounded-lg border border-border/60 bg-accent/45 px-3 py-2 text-sm text-foreground",

  eyebrow: "text-sm uppercase tracking-[0.2em] text-primary/80",
  titleLg: "text-lg font-medium text-foreground",
  titleXl: "text-5xl font-semibold tracking-tight text-foreground",
  titleMd: "text-2xl font-semibold text-foreground",
  subtitle: "text-lg leading-8 text-muted-foreground",
  body: "text-sm leading-6 text-muted-foreground",
  caption: "text-xs text-muted-foreground",

  link: "text-primary transition hover:text-primary/85",
  navActive: "bg-accent text-primary",
  navIdle:
    "text-muted-foreground hover:bg-secondary hover:text-foreground",

  ctaPrimary:
    "rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/20 transition hover:bg-primary/90",
  ctaSecondary:
    "rounded-lg border border-border bg-card/85 px-6 py-3 text-sm font-medium text-foreground/90 backdrop-blur transition hover:bg-card",

  tag: "rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-primary",
  tagMuted:
    "rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-foreground",
  filterActive: "rounded-md bg-secondary font-medium text-foreground",
  filterIdle:
    "rounded-md bg-card text-muted-foreground ring-1 ring-border hover:bg-secondary",

  avatar:
    "inline-flex shrink-0 items-center justify-center rounded-lg bg-secondary font-medium text-primary",
  /** 个人主页 / 资料设置中的大尺寸头像 */
  profileHeroAvatar: "rounded-2xl",

  authCard:
    "w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-sm",
} as const;
