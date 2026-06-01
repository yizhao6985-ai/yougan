/**
 * 有感 · Yougan 全站文案（C 端口径）
 *
 * 对外主张：帮你找灵感 → AI 团队精良制作内容。
 * 一件作品三种可随时切换的模式：灵感 · 创作 · 提问。
 */

export const BRAND = {
  full: "有感 · Yougan",
  en: "Yougan",
  taglineLanding: "AI 自媒体创作助手",
  taglineApp: "灵感 · 创作 · 提问",
  metaDescription:
    "有感 Yougan — AI 自媒体创作助手。帮你找灵感、理清选题，AI 团队按计划精良制作图文内容，支持小红书、公众号等平台。",
  documentTitle: "有感 · Yougan — AI 自媒体创作助手",
} as const;

export const THEME = {
  darkMode: "深色模式",
} as const;

export const LOCALE = {
  label: "语言",
  comingSoon: "即将推出",
} as const;

export const NAV = {
  about: "关于我们",
  aboutShort: "关于",
  features: "产品能力",
  featuresShort: "能力",
  mobile: "手机 App",
  mobileShort: "App",
  feedback: "问题反馈",
  feedbackShort: "反馈",
  login: "登录",
} as const;

export const FEEDBACK = {
  eyebrow: "产品反馈",
  title: "告诉我们你遇到的问题",
  subtitle:
    "功能异常、体验建议或使用疑问都可以在这里提交。我们会自动附上页面与环境信息，方便排查。后台接入前，提交内容会复制到剪贴板，你也可以一键用邮件发送。",
  backStudio: "返回创作台",
  backHome: "返回首页",
  categoryLabel: "反馈类型",
  descriptionLabel: "详细描述",
  descriptionPlaceholder:
    "请尽量写清楚：你当时在做什么、期望发生什么、实际发生了什么。如有报错提示也请一并写上。",
  descriptionHint: "至少 10 个字，描述越具体越有助于我们定位问题。",
  descriptionMinError: "请至少填写 10 个字的描述",
  contactLabel: "联系邮箱（选填）",
  contactPlaceholder: "方便我们回复你",
  contactHint: "登录状态下会自动填入当前账号邮箱。",
  privacyNote: "提交时会附带当前页面地址与浏览器信息，不含密码等敏感数据。",
  submit: "提交反馈",
  submitting: "处理中…",
  submitSuccess: "反馈内容已准备好",
  submitSuccessCopied: "反馈内容已复制到剪贴板",
  submitSuccessHint:
    "请点击「用邮件发送」完成投递，或自行粘贴到你们团队使用的反馈渠道。正式反馈系统接入后，将改为直接提交到后台。",
  copyAgain: "重新复制",
  copiedAgain: "已复制",
  openMail: "用邮件发送",
  submitAnother: "再提交一条",
  footerNote: "商务合作与媒体咨询请见",
  footerAboutLink: "关于我们",
  navLabel: "问题反馈",
  navDescription: "Bug、建议与使用疑问",
} as const;

export const ABOUT_PAGE = {
  back: "返回首页",
  eyebrow: "关于有感",
  title: "找灵感，让 AI 团队帮你精做内容",
  subtitle:
    "很多工具问一句就出一篇，选题偏了就要整篇重写。有感先帮你找灵感、对齐平台和写法，再由 AI 团队制定计划、精良制作成稿。每一步可确认、可回溯，少返工。",
  missionTitle: "我们在做什么",
  missionBody:
    "有感（Yougan）是一款面向自媒体创作者的 AI 创作助手。好内容不是一次 Prompt 碰运气——先找灵感、再按计划精做、成稿可反复改。产品以 Web 创作台为核心，配合「发现灵感」社区与多平台发布，帮你稳定周更、少折腾。",
  valuesTitle: "我们坚持的原则",
  values: [
    {
      title: "过程先于成品",
      body: "已确认灵感与成稿分阶段沉淀在「作品面板」里；制作计划在对话中跟进，方向偏了可及早纠正。",
    },
    {
      title: "人做判断，AI 团队执行",
      body: "选题、计划与发布由你确认；灵感模式帮你整理方向，创作模式由 AI 团队按计划出稿，过程有记录、方便回看。",
    },
    {
      title: "为真实工作流设计",
      body: "面向小红书、公众号等日常更新；支持作品分组、云端同步，以及图文、音视频等多形态制作任务。",
    },
    {
      title: "坦诚的产品边界",
      body: "灵感模式专注找方向、提问模式专注答疑与建议、创作模式专注按计划出稿——各做各的事，边界清晰。",
    },
  ] as const,
  productTitle: "我们的产品",
  productBody:
    "创作台提供灵感、创作、提问三种模式，一件作品对应一段持续对话；侧栏同步灵感与成稿，制作计划在对话中以任务列表展示。内容可发布到「发现灵感」供他人参考，Pro 会员可绑定主流平台账号，少一道复制粘贴。",
  productLink: "了解产品能力",
  contactTitle: "联系我们",
  contactBody:
    "产品反馈、商务合作或媒体咨询，欢迎发送邮件。我们会在工作日尽快回复。",
  contactEmail: "hello@yougan.com",
  ctaStudio: "开始创作",
  ctaFeatures: "查看产品能力",
} as const;

export const HOME = {
  eyebrow: BRAND.en,
  title: "有感",
  titleSuffix: "AI 自媒体创作助手",
  subtitle:
    "帮你找灵感、理清平台和选题；AI 团队制定制作计划，文案/设计/音视频按计划精良出稿。适合小红书、公众号等日常更新。",
  ctaStudio: "开始创作",
  ctaFeatures: "了解产品能力",
  capabilitiesTitle: "三种模式，一件作品走完全流程",
  capabilitiesLink: "查看说明 →",
} as const;

export const FEATURES_PAGE = {
  back: "返回首页",
  eyebrow: "产品能力",
  title: "从找灵感到 AI 团队出稿",
  subtitle:
    "很多 AI 工具问一句就出一篇，选题偏了就要整篇重写。有感先帮你找灵感、对齐写法，再由 AI 团队定计划、精良制作；中间随时提问、改计划。三种模式可随时切换。",
  platformsIntro: "支持这些平台的内容形态",
  workflowTitle: "推荐使用方式",
  workflowSubtitle: "从新建作品到可以发布，一般这样走（模式可随时切换）",
  modesTitle: "三种创作模式",
  modesSubtitle:
    "同一件作品里可随时切换；用界面、快捷键，或在对话里说「切到创作模式」都可以。",
  studioTitle: "创作台布局",
  studioSubtitle: "左侧作品列表、中间对话、右侧作品面板",
  modeBenefitsHeading: "会帮你做",
  modeLimitsHeading: "这一步不做",
  ctaStudio: "打开创作台",
  ctaMobile: "下载手机 App",
} as const;

export const MOBILE_PAGE = {
  back: "返回首页",
  eyebrow: "有感 · 手机端",
  title: "随时记灵感，回电脑精做内容",
  subtitle:
    "通勤、摸鱼、睡前有想法，用手机先记下来；回到 Web 创作台，在同一件作品里继续找灵感、看制作计划与成稿。账号与作品自动同步。",
  downloadTitle: "扫码下载",
  downloadSubtitle: "选择设备，扫码或点击按钮前往应用商店",
  downloadHint: "使用手机相机或微信扫一扫",
  downloadPendingTitle: "下载链接待配置",
  downloadPendingBody:
    "请在部署环境设置 VITE_MOBILE_DOWNLOAD_URL，或分别配置 iOS / Android 链接。",
  downloadAdminHint: "下载链接尚未配置，请联系管理员设置环境变量",
  ctaStudio: "打开 Web 创作台",
  ctaFeatures: "了解产品能力",
  features: [
    {
      title: "快速记灵感",
      body: "有选题想法或片段文案，随时打开记一笔；回到电脑前在同一件作品里接着聊、接着做。",
    },
    {
      title: "与 Web 同步",
      body: "同一账号、同一件作品。手机查看和记录，电脑端由 AI 团队定计划、精良制作完整内容。",
    },
    {
      title: "方便预览交付",
      body: "路上看看制作计划与成稿预览，确认方向对不对，不必在小屏上改长文。",
    },
  ] as const,
} as const;

export const DISCOVER_SECTION = {
  title: "发现灵感",
  navLabel: "发现灵感",
  navLabelShort: "发现",
  description: "浏览创作者公开分享的内容，按体裁与媒介找到你想看的灵感。",
  intentHeading: "你想看什么",
  intentDescription: "按消费意图快速筛选，也可以在下方的详细筛选项里组合条件。",
  featuredHeading: "精选推荐",
  moreHeading: "更多内容",
  emptyFiltered: "没有符合筛选的内容，试试放宽条件。",
  emptyDefault: "还没有公开内容，稍后再来看看。",
  loadError: "加载失败，请稍后再试",
  notFound: "内容不存在或已下架",
  continueBrowse: "返回发现灵感",
  clearFilters: "清除筛选",
} as const;

export function discoverBackLabel() {
  return `返回${DISCOVER_SECTION.title}`;
}

export const PROFILE_SECTION = {
  title: "个人主页",
  publicationsHeading: "已发布内容",
  emptyPublications: "还没有公开内容。",
  loadError: "加载失败，请稍后再试",
  notFound: "用户不存在",
  editProfile: "编辑资料",
  publicationCount: (count: number) => `已发布 ${count} 篇内容`,
  statsPublished: "已发布",
  statsViews: "总阅读",
  statsViewsHint: "公开内容详情页访问累计",
  statsTrend: "近 6 月发布",
  avatarLabel: "头像",
  avatarHint: "支持 JPEG、PNG、WebP、GIF，不超过 3MB",
  coverLabel: "主页封面",
  coverHint: "展示在个人主页顶部，建议宽图，不超过 8MB",
} as const;

export const ACCOUNT = {
  emailChangeTitle: "修改登录邮箱",
  emailChangeHint:
    "向新邮箱发送确认链接；需输入当前密码。确认前仍使用原邮箱登录。",
  emailChangeSent: "确认邮件已发送到新邮箱，请查收（开发环境可查看 API 控制台链接）。",
  newEmailPlaceholder: "新邮箱地址",
  currentPasswordPlaceholder: "当前密码（验证身份）",
  sendConfirmEmail: "发送确认邮件",
} as const;

export const AUTH = {
  loginTitle: "登录有感",
  registerTitle: "创建账号",
  loginFormSubtitle: "使用邮箱登录，继续你的创作",
  registerFormSubtitle: "注册后作品、灵感与制作记录将云端保存",
  loginSubtitle: "作品、灵感与制作记录云端保存，换设备也能接着写",
  forgotTitle: "忘记密码",
  forgotSubtitle: "输入注册邮箱，我们会发送重置链接（若该邮箱已注册）",
  forgotSent:
    "如果该邮箱已注册，你会收到一封包含重置链接的邮件。请检查收件箱与垃圾邮件文件夹。",
  forgotSentHint:
    "若未收到邮件，请确认邮箱是否已注册，或查看 API 控制台是否出现「no account found」日志。",
  forgotDev:
    "本地开发模式：该邮箱已匹配到账号，可直接使用下方链接重置密码。",
  backHome: "返回首页",
  backLogin: "返回登录",
} as const;

export const SETTINGS = {
  backStudio: "返回创作台",
  sectionLabel: "个人设置",
  navGroups: {
    account: "账户",
    billing: "会员与计费",
    content: "创作与发布",
    connect: "连接",
    help: "帮助",
  },
  publicationsIntro: (discoverTitle: string) =>
    `管理你发布到有感的内容。想逛公开作品，请前往「${discoverTitle}」。`,
} as const;

export const MEMBERSHIP = {
  navLabel: "会员",
  navDescription: "套餐与 AI 创作额度",
  pageTitle: "会员",
  pageDescription:
    "查看当前套餐与 AI 创作额度。升级 Pro 获得更高额度与完整 AI 团队制作能力。",
  currentPlan: "当前套餐",
  usageTitle: "本月 AI 创作额度",
  usageHint: (used: number, total: number) =>
    `已使用 ${used} / ${total} 次，每次对话生成计 1 次`,
  usageExceeded: "本月额度已用完，升级 Pro 或等待下月重置",
  plansTitle: "可选套餐",
  upgradeButton: "升级 Pro",
  checkoutButton: (cycle: string) => `确认开通 · ${cycle}`,
  checkoutPending: "处理中…",
  cancelAtPeriodEnd: "到期后不再续费",
  resumeSubscription: "恢复自动续费",
  freeBadge: "免费版",
  proBadge: "Pro",
  periodEnd: (date: string) => `当前周期至 ${date}`,
  payOnBillingPage: "支付与订单记录请前往",
  payOnBillingLink: "订单与支付",
} as const;

export const BILLING = {
  navLabel: "订单与支付",
  navDescription: "账单记录与退款",
  pageTitle: "订单与支付",
  pageDescription:
    "查看订阅付款记录。退款仅影响对应订单，成功后将按规则调整会员权益。",
  ordersTitle: "账单记录",
  ordersEmpty: "还没有账单记录",
  mockPaymentNotice:
    "当前为模拟支付；正式支付通道接入后，下单将在本页完成，支付成功自动开通会员。",
  refundButton: "申请退款",
  refundPending: "处理中…",
  refundConfirm: "退款后 Pro 权益将立即收回，确定继续？",
  refundSuccess: "退款成功，会员权益已更新",
  membershipLink: "查看会员与额度",
  orderStatus: {
    pending: "待支付",
    paid: "已支付",
    failed: "支付失败",
    refunded: "已退款",
  },
} as const;

export const STUDIO = {
  worksTitle: "我的作品",
  worksSlogan: "找灵感，出好稿",
  createMenuLabel: "新建",
  conversationsLoading: "加载对话中…",
  newConversation: "新对话",
  newWork: "新建作品",
  newGroup: "新建分组",
  emptyTitle: "创建第一件作品",
  emptyBody:
    "建议先用灵感模式找灵感、定方向，需要时在提问模式答疑；切到创作模式后，AI 团队会制定计划并精良制作成稿。",
  emptyWorksList: "还没有作品或分组，先创建一件，从找灵感开始。",
  emptyWorksFiltered: "创建第一件作品，从找灵感开始。",
  referencesCount: (n: number) => `已添加 ${n} 条参考素材`,
  publishViewInDiscover: (sectionTitle: string) => `在${sectionTitle}查看`,
  modelTemperatureLabel: "创意度",
  modelTemperatureHint:
    "仅影响创作模式中 AI 团队的文案与专员出稿，不影响灵感/提问对话与制作计划编排（0.1–1.0）",
} as const;

export const CHAT_COPY = {
  openingSuggestions: [
    "想更新自媒体但还没想好写什么",
    "怎么把这个选题写得更好？",
    "按制作计划生成一版文案",
    "想做职场类内容，不确定选题方向",
    "小红书笔记一般是什么结构？",
  ],
  placeholder: "说说想法、提问，或告诉我要改什么…",
  emptyTitle: "从一句话开始",
  emptyBody:
    "我会根据你的话自动对齐方向、回答问题，或在合适时开始制作；成稿与灵感会沉淀在右侧作品面板。",
  emptyByMode: {
    inspiration: {
      title: "灵感模式：找灵感、定方向",
      bodyDefault:
        "我会通过提问帮你找灵感、理清平台、受众、选题和写法；回合结束后会在下方给出可点选建议。",
    },
    ask: {
      title: "提问模式：自由提问",
      body: "问怎么做得更好、创作技巧怎么学、行业或平台怎么回事——我会按问题类型给优化建议、答疑或背景分析，帮你把创作想明白。",
    },
    creation: {
      title: "创作模式：AI 团队精良制作",
      body: "AI 团队会先制定制作计划，任务会在对话中以列表展示并随执行更新；成稿见右侧「内容预览」。",
    },
  },
  status: {
    inspirationExploring: "正在帮你找灵感、理清选题和写法",
    inspirationConfirmed: (n: number) => `已记录 ${n} 条灵感`,
    askExploring: "有问题随时问：优化、学习、行业背景都可以",
    creationPlanning: "AI 团队正在制定制作计划",
    creationIdle: "制作计划已定稿，可以交付或修改",
    creationPending: (n: number) => `${n} 项制作任务待执行`,
  },
  replying: "正在回复…",
  recommendationsLoading: "正在生成开场建议…",
  attachmentDrawer: {
    title: (count: number) => `附件 ${count}`,
    hint: "发送消息时一并提交",
    expand: "展开附件",
    collapse: "收起附件",
    remove: (name: string) => `移除 ${name}`,
    uploadTooltip: "添加参考图",
    uploading: "上传中…",
    maxReached: "最多 6 张参考图",
  },
} as const;

/** 创作台右侧栏 */
export const CREATIVE_CONTEXT_PANEL = {
  title: "作品面板",
  hint: "灵感、成稿预览、参考素材与版本记录集中在这里；制作计划在对话流中以任务列表展示",
  expand: "展开作品面板",
  collapse: "收起作品面板",
  tabs: {
    inspiration: "灵感",
    preview: "内容预览",
    references: "参考素材",
    history: "版本",
  },
} as const;

export type CreativeContextTabId = keyof typeof CREATIVE_CONTEXT_PANEL.tabs;

/** 作品面板 · 版本历史 */
export const WORK_HISTORY_PANEL = {
  loading: "加载版本记录…",
  duplicateTitle: "另存为新作品",
  duplicateHint:
    "适合换平台、换选题：从当前进度复制一件新作品，不会影响这件作品。",
  duplicateAction: "另存为新作品",
  duplicating: "正在创建…",
  duplicateFromHere: "从此版本复制",
  timelineTitle: "版本记录",
  timelineHint: "灵感定稿与成稿会各记一条；可回到任意一版继续编辑。",
  empty: "还没有版本记录。确认灵感或完成出稿后会出现。",
  headBadge: "当前",
  restore: "回到这一版",
  restoreTitle: "回到这一版？",
  restoreDescription:
    "将把这件作品切回到所选版本，当前进度会被替换，历史记录仍保留。",
  confirmRestore: "确认回到这一版",
  restoring: "恢复中…",
  cancel: "取消",
} as const;

/** 作品面板 · 灵感 */
export const CONTENT_SETTINGS_PANEL = {
  title: "灵感",
  hint: "灵感模式里确认的需求会写入 brief；可补充、修改或删除",
  confirmedLabel: "brief 需求",
  clearAll: "清空",
  empty: "还没有 brief 需求。在对话里确认方向后，Agent 会通过工具写入这里。",
} as const;

/** 对话流 · 制作计划任务列表 */
export const PRODUCTION_PLAN_TODO = {
  title: "制作计划",
  subtitlePlanning: "AI 团队正在拟定任务…",
  subtitleReady: (pending: number, done: number) =>
    done > 0
      ? pending > 0
        ? `已完成 ${done} 项 · 待执行 ${pending} 项`
        : `已完成 ${done} 项`
      : pending > 0
        ? `待执行 ${pending} 项`
        : "计划已定稿",
  empty: "进入创作模式后，任务会显示在这里并随执行更新。",
} as const;

export const PREVIEW_PANEL = {
  title: "内容预览",
  hint: "AI 团队交付的标题和正文显示在这里",
  empty: "AI 团队生成文案后，会显示在这里。",
} as const;

export const REFERENCE_PANEL = {
  title: "参考素材",
  hint: "对话中上传或解析的参考文案与图片会汇总在这里",
  empty: "添加参考素材后，会显示在这里。",
  typeLabels: {
    text: "文案",
    image: "图片",
    web: "网页",
  },
  fallbackTitle: (n: number) => `参考素材 ${n}`,
  expand: "展开",
  collapse: "收起",
  openLink: "打开链接",
  openImage: "查看原图",
  imageUnavailable: "图片不可用",
} as const;

export const INTEGRATIONS = {
  title: "平台集成发布",
  intro:
    "绑定账号后，在有感生成的内容可直接发到小红书、公众号等平台，少一道复制粘贴。",
  oauthSuccess: (label: string) =>
    `${label} 已连接，内容可从有感直接发布。`,
  oauthDocsLink: "查看 OAuth 配置文档",
  oauthStatusTitle: "OAuth 配置检查",
  oauthStatusIntro:
    "以下变量需在 API 服务（apps/api/.env）中配置。全部就绪后平台卡片才可发起授权。",
  oauthCallback: "授权回调地址",
  oauthConfigured: "已配置",
  oauthMissing: "未配置",
} as const;

export const PUBLISH = {
  checking: "正在检查发布状态…",
  publishedBadge: "已发布",
  draftBadge: "草稿已保存",
  publishButton: "发布到有感",
  publishing: "发布中…",
  confirmTitle: "确认发布分类",
  confirmDescription:
    "系统已根据你的创作内容推断分类标签。你可以修改后再发布，帮助其他用户在发现页找到你的内容。",
  inferredTags: "AI 推断标签",
  previewLoading: "正在分析内容分类…",
  previewError: "无法加载分类预览，请稍后再试",
  fieldFormat: "内容体裁",
  fieldTopic: "主题类别",
  fieldMedia: "媒介形态",
  fieldPlatform: "目标平台",
  cancel: "取消",
  confirmPublish: "确认发布",
  goPublish: "去创作台写内容",
  emptyPublications: "还没有发布过的内容",
} as const;
