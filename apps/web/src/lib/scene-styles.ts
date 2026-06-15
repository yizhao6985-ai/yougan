/**
 * 营销页 / 静态内容页 / 设置页 — 统一布局与排版约定
 * （发现灵感、主页、产品能力、手机 App、关于我们、个人设置）
 */
export const scene = {
  marketing: "flex min-h-screen flex-col page-gradient",
  app: "flex min-h-screen flex-col bg-background",
  appShell: "flex h-screen flex-col overflow-hidden bg-background",

  chrome:
    "sticky top-0 z-40 border-b border-border/80 bg-card/90 px-4 py-3.5 shadow-sm shadow-border/25 backdrop-blur-md sm:px-6 sm:py-4 lg:px-8",
  headerNavLink:
    "inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors duration-200 md:h-11 md:px-3.5 lg:px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
  composer:
    "pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-background from-35% via-background/85 to-transparent px-4 pb-3 pt-12",
  conversationPadBottom: "pb-60",
  openingSuggestionsSlot:
    "w-full max-w-5xl min-h-[17rem] shrink-0 flex flex-col items-center",
  conversationScrollButton:
    "bottom-44 size-8 rounded-lg border-0 bg-background/80 text-muted-foreground shadow-md shadow-black/10 backdrop-blur-sm hover:bg-muted/65 hover:text-foreground hover:shadow-lg hover:shadow-black/15 dark:bg-background/60 dark:shadow-black/45 dark:hover:shadow-black/55",
  composerFloatingInput:
    "[&_[data-slot=input-group]]:rounded-lg [&_[data-slot=input-group]]:border-border/80 [&_[data-slot=input-group]]:bg-card/95 [&_[data-slot=input-group]]:shadow-lg [&_[data-slot=input-group]]:shadow-border/25 [&_[data-slot=input-group]]:backdrop-blur-sm [&_[data-slot=input-group]]:has-[[data-slot=input-group-control]:focus-visible]:ring-primary/20 [&_[data-slot=input-group]]:has-[[data-align=block-start]]:flex-col [&_[data-slot=input-group]]:has-[[data-align=block-start]]:items-stretch",
  studioPanelHeader:
    "flex min-h-[4.75rem] shrink-0 flex-col justify-center border-b border-border/80 bg-card/70 px-4 py-3 backdrop-blur",
  studioPanelHeaderTitle: "font-medium leading-5 text-foreground",
  studioPanelHeaderHint:
    "line-clamp-2 text-xs leading-4 text-muted-foreground",

  sidebar: "border-border/80 bg-secondary/35",
  sidebarSection: "space-y-2 border-b border-border/80 p-3",

  card: "rounded-lg border border-border/80 bg-card/95 shadow-sm shadow-border/20 backdrop-blur",
  cardInteractive:
    "cursor-pointer rounded-lg border border-border/80 bg-card/90 shadow-sm shadow-border/20 backdrop-blur transition-[colors,box-shadow,border-color] duration-200 hover:border-primary/25 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
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

  link: "text-primary transition-colors duration-200 hover:text-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
  navActive: "bg-accent text-primary",
  navIdle:
    "text-muted-foreground hover:bg-secondary hover:text-foreground",

  ctaPrimary:
    "rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/20 transition-colors duration-200 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
  ctaSecondary:
    "rounded-full border border-border bg-card/85 px-6 py-3 text-sm font-medium text-foreground/90 backdrop-blur transition-colors duration-200 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",

  tag: "rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-primary",
  tagMuted:
    "rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-foreground",
  filterActive: "rounded-md bg-secondary font-medium text-foreground",
  filterIdle:
    "rounded-md bg-card text-muted-foreground ring-1 ring-border hover:bg-secondary",

  avatar:
    "inline-flex shrink-0 items-center justify-center rounded-lg bg-secondary font-medium text-primary",
  accountHeroAvatar: "rounded-2xl",

  authCard:
    "w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-sm",

  /** 营销 / 静态内容页共用 */
  pageShell:
    "mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-10",
  pageMain: "flex-1 pb-16 pt-8 lg:pt-10",
  pageMainCompact: "flex-1 pb-12 pt-6 lg:pt-8",
  pageHeader: "max-w-2xl",
  pageHeaderWide: "max-w-3xl",
  pageTitle:
    "text-3xl font-semibold tracking-tight text-foreground sm:text-[2.5rem] sm:leading-tight",
  pageTitleHero:
    "text-4xl font-semibold tracking-tight text-foreground sm:text-5xl sm:leading-[1.08]",
  pageSubtitle: "text-base leading-7 text-muted-foreground sm:text-lg",
  pageEyebrow:
    "text-xs font-medium uppercase tracking-[0.18em] text-primary",
  pageMeta: "text-sm text-muted-foreground",
  sectionStack: "space-y-12",
  sectionStackLoose: "space-y-16",
  sectionBlock: "space-y-6",
  sectionTitle: "text-lg font-semibold tracking-tight text-foreground",
  sectionHeading: "text-2xl font-semibold tracking-tight text-foreground",
  sectionHint: "text-sm leading-6 text-muted-foreground",
  surface:
    "overflow-hidden rounded-2xl bg-card ring-1 ring-border/60 shadow-sm shadow-black/[0.02]",
  surfaceInteractive:
    "overflow-hidden rounded-2xl bg-card ring-1 ring-border/60 shadow-sm shadow-black/[0.02] transition-shadow duration-300 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20",
  surfaceInset: "rounded-2xl bg-accent/35 p-8 ring-1 ring-primary/10 sm:p-10",
  featureCard:
    "flex flex-col rounded-2xl bg-card p-6 ring-1 ring-border/60 transition-all duration-300 hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/15",
  featureCardInteractive:
    "group flex flex-col rounded-2xl bg-card p-6 ring-1 ring-border/60 transition-all duration-300 hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
  contentGrid3:
    "grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3",
  contentGrid4:
    "grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  contentGrid2: "grid grid-cols-1 gap-6 sm:grid-cols-2",
  backLink:
    "inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:text-primary",
  footerCta:
    "flex flex-wrap justify-center gap-4 border-t border-border/80 pt-12",
  pageReadColumn: "mx-auto w-full max-w-[42rem]",
  /** 文章详情：标题区与正文同宽 */
  articleColumn: "mx-auto w-full max-w-[42rem]",
  /** 文章详情：封面/媒体可略宽 */
  articleMediaColumn: "mx-auto w-full max-w-3xl",
  articleTitle:
    "text-[2rem] font-semibold leading-[1.12] tracking-tight text-foreground sm:text-[2.75rem] sm:leading-[1.1]",
  articleDek:
    "text-lg leading-8 text-muted-foreground sm:text-xl sm:leading-9",
  articleCategory: "text-sm font-medium text-primary",
  articleByline: "text-sm text-muted-foreground",
  articleProse:
    "prose prose-lg prose-stone max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-p:leading-[1.85] prose-li:leading-[1.75]",
  articleAuthorCard:
    "flex items-start gap-4 rounded-2xl bg-secondary/35 p-5 ring-1 ring-border/50 sm:p-6",
  articleDivider: "border-t border-border/70",
  pill:
    "inline-flex items-center rounded-full bg-secondary/80 px-3 py-1 text-sm text-foreground/90",

  /** 设置页 */
  settingsShell: "mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-10",
  settingsNavLink:
    "flex cursor-pointer flex-col rounded-xl px-3 py-2.5 transition-colors duration-200 lg:px-4",
  settingsNavLinkActive:
    "bg-accent/60 text-foreground ring-1 ring-primary/15",
  settingsNavLinkIdle:
    "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
  settingsPanel:
    "rounded-2xl bg-card/80 p-6 ring-1 ring-border/60 sm:p-8 lg:p-10",
  settingsPanelCard:
    "rounded-2xl bg-card p-5 ring-1 ring-border/60 sm:p-6",

  /** @deprecated 使用 page* token，保留别名便于渐进迁移 */
  discoverTitle: "text-3xl font-semibold tracking-tight text-foreground sm:text-[2.5rem] sm:leading-tight",
  discoverSubtitle: "text-base leading-7 text-muted-foreground sm:text-lg",
  discoverSectionTitle: "text-lg font-semibold tracking-tight text-foreground",
  discoverSectionHint: "text-sm text-muted-foreground",
  discoverShell: "mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-10",
  discoverFeedGrid:
    "grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
} as const;
