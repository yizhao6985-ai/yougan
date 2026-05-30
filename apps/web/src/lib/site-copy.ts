/**
 * 有感 · Yougan 全站文案
 *
 * 三步：灵感模式（找选题）→ 大纲模式（产出创作大纲）→ 创作模式（按大纲生成最终实现）
 */

export const BRAND = {
  full: "有感 · Yougan",
  en: "Yougan",
  taglineLanding: "AI 自媒体创作助手",
  taglineApp: "灵感 · 大纲 · 创作",
  metaDescription:
    "有感 Yougan — AI 自媒体创作助手。帮你找灵感、写创作大纲，再按大纲生成图文内容，支持小红书、公众号等平台。",
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
  login: "登录",
} as const;

export const ABOUT_PAGE = {
  back: "返回首页",
  eyebrow: "关于有感",
  title: "让创作过程可控、可回溯",
  subtitle:
    "我们专注服务自媒体创作者，用 AI 把「找选题、定结构、写出稿」拆成可确认的三步，减少返工，并连接从构思到发布的完整链路。",
  missionTitle: "我们在做什么",
  missionBody:
    "有感（Yougan）是一款 AI 自媒体创作助手。我们相信好内容不是一次 Prompt 碰运气，而是人在关键节点做判断、AI 在每一步做该做的事。产品以 Web 创作台为核心，配合发现灵感社区与多平台发布能力，帮助个人创作者稳定周更、少折腾。",
  valuesTitle: "我们坚持的原则",
  values: [
    {
      title: "过程先于成品",
      body: "灵感、大纲、成稿分阶段沉淀在「创作脉络」里，方向错了在早期纠正，而不是整篇重写。",
    },
    {
      title: "人做判断，AI 做执行",
      body: "选题、定稿、发布由你确认；AI 负责提问、整理、按纲生成与修改记录。",
    },
    {
      title: "为真实工作流设计",
      body: "面向小红书、公众号等日常更新场景，支持作品分组、云端同步与平台内容形态。",
    },
    {
      title: "坦诚的产品边界",
      body: "大纲未定稿不出正文、灵感模式不写稿——边界清晰，才能建立长期信任。",
    },
  ] as const,
  productTitle: "我们的产品",
  productBody:
    "有感创作台提供灵感、大纲、创作三种模式，一件作品对应一段持续对话；内容可发布到「发现灵感」供他人参考，Pro 会员可绑定主流平台账号减少复制粘贴。",
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
    "没选题时帮你找灵感，有方向后一起写创作大纲，再按大纲生成能发的图文。适合小红书、公众号等日常更新。",
  ctaStudio: "开始创作",
  ctaFeatures: "了解产品能力",
  capabilitiesTitle: "三步完成一篇内容",
  capabilitiesLink: "查看说明 →",
} as const;

export const FEATURES_PAGE = {
  back: "返回首页",
  eyebrow: "产品能力",
  title: "从找灵感到发出内容",
  subtitle:
    "很多 AI 工具问一句就出一篇，选题不准就要整篇重写。有感拆成三步：先定选题和写法，再写出创作大纲，最后按大纲生成标题和正文。",
  platformsIntro: "支持这些平台的内容形态",
  workflowTitle: "推荐使用方式",
  workflowSubtitle: "从新建作品到可以发布，一般这样走",
  modesTitle: "三种创作模式",
  modesSubtitle:
    "同一件作品里可随时切换；用界面、快捷键，或在对话里说「切到大纲模式」都可以。",
  studioTitle: "创作台布局",
  studioSubtitle: "左侧作品列表、中间对话、右侧创作脉络",
  modeBenefitsHeading: "会帮你做",
  modeLimitsHeading: "这一步不做",
  ctaStudio: "打开创作台",
  ctaMobile: "下载手机 App",
} as const;

export const MOBILE_PAGE = {
  back: "返回首页",
  eyebrow: "有感 · 手机端",
  title: "随时记灵感，回电脑写全文",
  subtitle:
    "通勤、摸鱼、睡前有想法，用手机先记下来；回到 Web 创作台，在同一件作品里继续写大纲、生成图文。账号与作品自动同步。",
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
      body: "有选题想法或片段文案，随时打开记一笔；回到电脑前在同一件作品里接着写。",
    },
    {
      title: "与 Web 同步",
      body: "同一账号、同一件作品。手机查看和记录，电脑端写大纲、生成完整内容。",
    },
    {
      title: "方便预览成稿",
      body: "路上看看大纲和生成结果，确认方向对不对，不必在小屏上改长文。",
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
  loginSubtitle: "作品和创作记录云端保存，换设备也能接着写",
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
  },
  publicationsIntro: (discoverTitle: string) =>
    `管理你发布到有感的内容。想逛公开作品，请前往「${discoverTitle}」。`,
} as const;

export const MEMBERSHIP = {
  navLabel: "会员",
  navDescription: "套餐与 AI 创作额度",
  pageTitle: "会员",
  pageDescription:
    "查看当前套餐与 AI 创作额度，升级 Pro 获得更高额度与增强出稿。",
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
  worksHint: "每件作品一段对话，支持分组",
  newWork: "新建作品",
  newGroup: "新建分组",
  emptyTitle: "创建第一件作品",
  emptyBody:
    "建议先用灵感模式定选题，再用大纲模式写出创作大纲，最后用创作模式按大纲生成标题和正文。",
  referencesCount: (n: number) => `已添加 ${n} 条参考素材`,
  publishViewInDiscover: (sectionTitle: string) => `在${sectionTitle}查看`,
  modelTemperatureLabel: "创意度",
  modelTemperatureHint: "调节 AI 创意程度，越高越有新意（0.1–1.0）",
} as const;

export const CHAT_COPY = {
  inspirationSuggestions: [
    "想更新自媒体但还没想好写什么",
    "想做职场类内容，不确定选题方向",
    "还没定发小红书还是公众号",
  ],
  outlineSuggestions: [
    "想在小红书发一篇护肤种草，帮我写一份创作大纲",
    "受众是 25–35 岁职场女性，语气专业、好读",
    "大纲里要包含封面风格和正文结构",
  ],
  creationSuggestions: [
    "按当前大纲生成一版文案",
    "语气改得更口语一点",
    "标题再吸引人一点",
  ],
  placeholders: {
    inspiration: "也可以直接输入；有选项时点击即发送…",
    outline: "补充结构、段落、风格等，完善创作大纲…",
    creation: "说说要改什么，会先记入待执行项再按大纲生成…",
  },
  emptyByMode: {
    inspiration: {
      title: "灵感模式：找选题、定方向",
      bodyDefault:
        "我会通过提问帮你理清平台、受众、选题和写法；有选项时可直接点击发送，确认后的内容会写入创作脉络。",
      bodyWithRecommendations: "根据作品标题准备了灵感推荐，点一个即可开始。",
    },
    outline: {
      title: "大纲模式：写创作大纲",
      body: "我会根据已确认灵感，把结构、段落、风格等整理成创作大纲；你说「就这些」后定稿，再进入创作模式按大纲出稿。",
    },
    creation: {
      title: "创作模式：按大纲出稿",
      body: "会按已定稿的创作大纲生成与修改标题、正文，并记录本次改了什么。",
    },
  },
  status: {
    inspirationExploring: "正在帮你理清选题和写法",
    inspirationConfirmed: (n: number) => `已确认 ${n} 条需求`,
    outlineDraft: "正在撰写创作大纲，定稿前不生成正文",
    outlinePending: (n: number) => `${n} 条大纲待补充或定稿`,
    outlineReady: "创作大纲已定稿，可以按大纲出稿了",
    creationIdle: "暂无待执行的修改",
    creationPending: (n: number) => `${n} 条修改待执行`,
  },
  modeShortcutsFooter: (labels: {
    inspiration: string;
    outline: string;
    creation: string;
  }) =>
    `切换模式：${labels.inspiration} 灵感 · ${labels.outline} 大纲 · ${labels.creation} 创作`,
  thinking: "正在回复…",
  reasoning: {
    streaming: "正在思考…",
    doneBrief: "思考完成",
    doneSeconds: (seconds: number) => `思考了 ${seconds} 秒`,
  },
  generatingInspirations: "正在生成灵感推荐…",
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
  title: "创作脉络",
  hint: "灵感、大纲与成稿在这里逐步沉淀，切换模式时持续更新",
  expand: "展开创作脉络",
  collapse: "收起创作脉络",
  tabs: {
    inspiration: "灵感",
    outline: "创作大纲",
    preview: "内容预览",
    references: "参考素材",
  },
} as const;

export type CreativeContextTabId = keyof typeof CREATIVE_CONTEXT_PANEL.tabs;

/** 创作脉络 · 灵感 */
export const CONTENT_SETTINGS_PANEL = {
  title: "灵感",
  hint: "灵感模式里经你确认的内容会汇总在这里，可补充、修改或删除",
  confirmedLabel: "已确认灵感",
  clearAll: "清空",
  empty: "还没确认灵感时，我会通过提问帮你定选题和写法。你确认的内容会列在这里。",
} as const;

/** 创作脉络 · 创作大纲 */
export const PLAN_PANEL = {
  title: "创作大纲",
  hint: "含已实现与待实现条目；大纲模式定稿后进入创作模式按大纲出稿",
  pendingLabel: "待实现",
  pendingEmpty: "暂无待实现条目。进入大纲模式后会根据灵感自动生成，也可手动补充。",
  executedLabel: "已实现",
  executedEmpty: "创作模式执行后，或对照已有作品时，已实现的条目会显示在这里",
} as const;

export const PREVIEW_PANEL = {
  title: "内容预览",
  hint: "创作模式按大纲生成标题和正文后显示在这里",
  empty: "创作模式生成文案后，会显示在这里。",
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
