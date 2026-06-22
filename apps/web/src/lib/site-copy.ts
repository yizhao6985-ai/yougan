/**
 * 有感 · Yougan 全站文案（C 端口径 · 制作流程）
 *
 * 语气：清楚、有步骤感，帮用户知道「现在在哪一环节、下一步是什么」。
 *
 * 制作流程：定方案 → 备参考 → 执行制作 → 产出作品 → 留存版本
 *
 * 作品面板四 Tab（简称 / 面板全称）：
 * - 方案 / 制作方案
 * - 参考 / 参考素材
 * - 作品 / 作品内容
 * - 版本 / 版本记录
 */

export const BRAND = {
  full: "有感 · Yougan",
  en: "Yougan",
  taglineLanding: "AI 让你有感而发",
  taglineApp: "方案 · 制作 · 提问",
  metaDescription:
    "有感 Yougan — AI 多媒体创作助手。支持文字、图片、音频、视频与混排作品；维护制作方案、解析参考素材、AI 团队按计划出稿，可版本回溯与一键发布。",
  documentTitle: "有感 · Yougan — AI 多媒体创作助手",
} as const;

export const THEME = {
  darkMode: "深色模式",
} as const;

export const LOCALE = {
  label: "语言",
  comingSoon: "敬请期待",
} as const;

export const NAV = {
  studio: "开始创作",
  studioShort: "创作",
  about: "关于我们",
  aboutShort: "关于",
  features: "使用指南",
  featuresShort: "指南",
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
  title: "先定方案，再按计划做出作品",
  subtitle:
    "很多工具跳过确认直接生成，方向偏了就要重来。有感把创作拆成「定方案 → 制作 → 修改」：方案你点头，AI 团队按计划执行，每一步都能回看。",
  missionTitle: "我们在做什么",
  missionBody:
    "有感是面向创作者的 AI 创作助手。一件作品走完整制作流程——先整理制作方案，再交给 AI 团队执行，作品产出后可继续修改。Web 创作台是核心工作区，「发现灵感」可浏览公开作品。",
  valuesTitle: "我们坚持的原则",
  values: [
    {
      title: "方案先于制作",
      body: "制作方案和作品产出分开展示，都在作品面板；方向有偏差时，在方案阶段就能纠正。",
    },
    {
      title: "你确认，AI 执行",
      body: "方案、制作计划与发布由你确认；AI 团队按既定方案制作，过程有记录。",
    },
    {
      title: "覆盖多种创作形态",
      body: "支持文字、绘画、脚本、音视频等制作任务；作品可分组、云端同步。",
    },
    {
      title: "环节边界清晰",
      body: "定方案、执行制作、提问答疑各司其职；你通过对话推进，系统自动路由。",
    },
  ] as const,
  productTitle: "我们的产品",
  productBody:
    "每件作品对应一段持续对话。系统按消息推进方案、制作或答疑；右侧作品面板同步制作方案与作品内容，对话中可查看制作计划。完成后可发布到「发现灵感」。",
  productLink: "使用指南",
  contactTitle: "联系我们",
  contactBody:
    "产品反馈、商务合作或媒体咨询，欢迎发送邮件。我们会在工作日尽快回复。",
  contactEmail: "hello@yougan.com",
  ctaStudio: "开始创作",
  ctaGuide: "使用指南",
} as const;

export const HOME = {
  eyebrow: BRAND.en,
  title: "有感",
  tagline: BRAND.taglineLanding,
  mediaSpectrum: "文章 · 插画 · 脚本 · 音视频",
  subtitle:
    "维护制作方案、解析参考素材、AI 团队按计划出稿，支持版本回溯与一键发布。",
  ctaStudio: "开始创作",
  ctaGuide: "使用指南",
  modalitiesLabel: "支持媒介",
  formsLabel: "创作形态",
  formsEyebrow: "创作形态",
  formsTitle: "一件作品，多种形态",
  formsSubtitle:
    "文字、图片、音频、视频可单独出稿，也可混排在同一作品里。",
  featuresBridge:
    "创作能力、发布平台与产品助手——从出稿到被看见，有感一站覆盖。",
  featuresEyebrow: "核心功能",
  featuresTitle: "有感能帮你做什么",
  featuresSubtitle:
    "每项能力独立可用；具体操作步骤与标准流程见使用指南。",
  studioEyebrow: "创作台",
  studioTitle: "对话 + 作品面板，一页搞定",
  studioSubtitle:
    "左侧作品列表、中间对话区、右侧方案 / 参考 / 作品 / 版本四个 Tab，同步展示创作状态。",
  extrasTitle: "更多能力",
  platformEyebrow: "平台",
  platformTitle: "作品值得被看见",
  platformSubtitle:
    "「发现灵感」是有感的内容平台——发布、浏览与积累作品集，让创作走出工作台。",
  platformCta: "去发现灵感",
  assistantEyebrow: "助手",
  assistantTitle: "有疑问，随时问有感助手",
  assistantSubtitle:
    "页头一键打开，帮你弄清功能与用法，不用翻文档也能快速上手。",
  guideLink: "查看使用指南 →",
} as const;

/** 页头 RAG 产品助手（有感助手） */
export const HELP_ASSISTANT = {
  eyebrow: "助手",
  title: "有疑问，随时问有感助手",
  subtitle:
    "基于产品知识库的问答助手，帮你弄清功能与用法，不用翻文档也能快速上手。",
  highlights: [
    "页头一键打开，不离开当前页面",
    "解答创作流程、会员额度与发布说明",
    "回答有据可查，附产品文档来源",
  ],
  sampleQuestionsTitle: "可以这样问",
  sampleQuestions: [
    "有感是什么？适合做什么内容？",
    "如何开始第一次创作？",
    "会员和 AI 额度怎么算？",
  ],
  entryHint: "点击页头导航栏中的「有感助手」即可打开。",
} as const;

export const GUIDE_PAGE = {
  back: "返回首页",
  eyebrow: "使用指南",
  title: "上手有感创作台",
  subtitle:
    "从新建作品到发布分享，按实际操作顺序说明怎么用。功能概览与能力边界见首页。",
  bridge:
    "先熟悉创作台布局，再按标准流程走完一件作品；版本管理与发布操作见后文。",
  overviewLink: "查看首页功能概览 →",
  quickStartEyebrow: "快速上手",
  quickStartTitle: "第一次创作",
  quickStartSubtitle:
    "注册登录后进入创作台，按下面五步即可完成第一件作品。",
  studioEyebrow: "创作台",
  workflowEyebrow: "创作流程",
  workflowTitle: "标准创作流程",
  workflowSubtitle:
    "定方案 → 备参考 → 制作 → 提问与修改；每条消息系统自动路由到对应环节。",
  capabilitiesDetailTitle: "各环节怎么用",
  capabilitiesDetailSubtitle:
    "下面按操作顺序说明：你在对话里做什么、系统会产出什么、这一步不会做什么。",
  creationLifecycleLabel: "版本与分叉",
  creationLifecycleHint:
    "成稿后想对比历史、或换方向平行探索，可以这样操作。",
  studioTitle: "创作台布局",
  studioSubtitle:
    "左侧作品列表、中间对话、右侧作品面板（方案 / 参考 / 作品 / 版本）",
  extrasTitle: "辅助能力",
  publishEyebrow: "发布",
  publishTitle: "发布与分享",
  publishSubtitle:
    "作品完成后，可在创作台内发布到有感公域，或绑定第三方平台一键分发。",
  publishSteps: [
    {
      title: "发布到有感",
      body: "在创作台确认作品内容后，选择「发布到有感」，作品将出现在「发现灵感」公域。",
    },
    {
      title: "绑定第三方平台",
      body: "在设置中绑定小红书、微博、公众号等平台账号，发布时选择目标平台，减少复制粘贴。",
    },
    {
      title: "积累作品集",
      body: "已发布作品汇总在个人主页，展示阅读量与发布趋势，便于沉淀作者品牌。",
    },
  ] as const,
  capabilityBenefitsHeading: "会帮你做",
  capabilityLimitsHeading: "这一步不做",
  ctaStudio: "开始创作",
  ctaMobile: "下载手机 App",
} as const;

/** @deprecated 使用 GUIDE_PAGE */
export const FEATURES_PAGE = GUIDE_PAGE;

export const MOBILE_PAGE = {
  back: "返回首页",
  eyebrow: "有感 · 手机端",
  title: "记录灵感，回电脑走完整流程",
  subtitle:
    "路上记下想法与参考；回到 Web 创作台，在同一件作品里继续定方案、查看制作进度与作品内容。账号与作品自动同步。",
  downloadTitle: "扫码下载",
  downloadSubtitle: "选择设备，扫码或点击按钮前往应用商店",
  downloadHint: "使用手机相机或微信扫一扫",
  downloadPendingTitle: "下载链接待配置",
  downloadPendingBody:
    "请在部署环境设置 VITE_MOBILE_DOWNLOAD_URL，或分别配置 iOS / Android 链接。",
  downloadAdminHint: "下载链接尚未配置，请联系管理员设置环境变量",
  ctaStudio: "打开 Web 创作台",
  ctaGuide: "使用指南",
  features: [
    {
      title: "记录灵感与参考",
      body: "随时记下创作方向或素材片段；回到电脑在同一件作品里继续定方案、进入制作。",
    },
    {
      title: "与 Web 同步",
      body: "同一账号、同一件作品。手机端记录，电脑端由 AI 团队按方案完成制作。",
    },
    {
      title: "查看制作进度",
      body: "查看制作计划与当前作品内容，确认方向；细节修改在电脑端进行。",
    },
  ] as const,
} as const;

export const DISCOVER_SECTION = {
  title: "发现灵感",
  navLabel: "发现灵感",
  navLabelShort: "发现",
  description:
    "浏览创作者公开分享的混排作品，从上往下完整阅读文字、图片与视听内容。",
  intentHeading: "你想看什么",
  intentDescription: "选一个方向快速开始，或在下方组合更多筛选条件。",
  featuredHeading: "精选推荐",
  featuredHint: "编辑挑选的视觉与内容质量更突出的作品。",
  moreHeading: "更多内容",
  moreHint: "继续浏览社区里的最新公开作品。",
  emptyFiltered: "没有符合筛选的内容，试试放宽条件。",
  emptyDefault: "还没有公开内容，稍后再来看看。",
  loadError: "加载失败，请稍后再试",
  notFound: "内容不存在或已下架",
  continueBrowse: "返回发现灵感",
  clearFilters: "清除筛选",
  dismissBanner: "关闭活动横幅",
} as const;

export function discoverBackLabel() {
  return `返回${DISCOVER_SECTION.title}`;
}

/** 用户账号主页（/user/:id）文案 */
export const ACCOUNT_PAGE = {
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
  phoneTab: "手机登录",
  passwordTab: "密码登录",
  phoneFormSubtitle: "未注册手机号验证通过后将自动创建账号",
  passwordFormSubtitle: "使用手机号或邮箱与密码登录",
  loginSubtitle: "手机验证码或密码登录，作品与制作记录云端保存",
  phoneLabel: "手机号",
  phonePlaceholder: "请输入您的手机号",
  smsCodeLabel: "验证码",
  smsCodePlaceholder: "请输入验证码",
  sendSmsCode: "获取验证码",
  resendSmsCode: (seconds: number) => `${seconds}s 后重发`,
  phoneSubmit: "立即登录",
  passwordLoginLabel: "手机号或邮箱",
  passwordLoginPlaceholder: "请输入您的邮箱或手机号",
  passwordPlaceholder: "请输入您的密码",
  passwordSubmit: "立即登录",
  devSmsHint: (code: string) => `开发环境验证码：${code}`,
  termsAgreePrefix: "登录或创建账户即表示您同意",
  termsService: "服务条款",
  termsAgreeJoin: "和",
  termsPrivacy: "隐私政策",
  termsRequired: "请先勾选同意服务条款与隐私政策",
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
    help: "帮助",
  },
  publicationsIntro: (discoverTitle: string) =>
    `管理你发布到有感的内容。浏览公开作品请前往「${discoverTitle}」。`,
} as const;

export const MEMBERSHIP = {
  navLabel: "会员",
  navDescription: "套餐与 AI 创作额度",
  pageTitle: "会员",
  pageDescription:
    "查看当前套餐与 AI 创作额度。升级 Pro / Pro+ 获得更高额度与旗舰出稿。",
  currentPlan: "当前套餐",
  usageTitle: "本月 AI 创作额度",
  usageHint: (percent: number) => `已使用本月额度的 ${percent}%`,
  usageExceeded: "本月额度已用完，升级套餐或等待下月重置",
  plansTitle: "可选套餐",
  upgradeButton: "升级套餐",
  checkoutButton: (planName: string, cycle: string) =>
    `开通 ${planName} · ${cycle}`,
  checkoutPending: "处理中…",
  cancelAtPeriodEnd: "到期后不再续费",
  resumeSubscription: "恢复自动续费",
  freeBadge: "免费版",
  proBadge: "Pro",
  proPlusBadge: "Pro+",
  paidBadge: "会员",
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
  worksSlogan: "定方案，做作品",
  createMenuLabel: "新建",
  conversationsLoading: "加载对话中…",
  newConversation: "新对话",
  newWork: "新建作品",
  newGroup: "新建分组",
  emptyTitle: "创建第一件作品",
  emptyBody:
    "从定方案开始：对话整理制作方案，需要时提问答疑，方案就绪后 AI 团队按计划制作。",
  emptyTourCta: "先看 30 秒快速引导",
  emptyWorksList: "还没有作品，创建一件并从定方案开始。",
  emptyWorksFiltered: "创建一件作品，从定方案开始。",
  referencesCount: (n: number) => `已添加 ${n} 条参考素材`,
  publishViewInDiscover: (sectionTitle: string) => `在${sectionTitle}查看`,
  modelTemperatureLabel: "创意度",
  modelTemperatureHint:
    "调节制作环节 AI 的发散程度（文字、视觉等）。不影响定方案、提问与制作计划。",
} as const;

/** 创作台 · 快速引导（Spotlight Tour） */
export const STUDIO_ONBOARDING = {
  triggerLabel: "快速引导",
  triggerShortLabel: "引导",
  skip: "跳过引导",
  next: "下一步",
  finish: "开始创作",
  close: "关闭",
  progress: (current: number, total: number) => `${current} / ${total}`,
  finishGuideLink: "查看完整使用指南",
  finishAssistantHint: "还有疑问？打开页头「有感助手」随时提问。",
  userMenuLabel: "创作台快速引导",
  revisitEntryHint: "之后可随时点击此处，再次查看快速引导",
  worksAsideRevisitFootnote:
    "左下角「快速引导」会常驻在这里，忘记某一步时可以随时重看。",
} as const;

export const CHAT_COPY = {
  openingSuggestionsLoading: "正在生成建议…",
  placeholderDefault: "说说想法、提问，或说明要改方案 / 改作品…",
  quotaExceededPlaceholder: "本月 AI 额度已用完，请升级套餐或等待下月重置",
  emptyTitle: "选择下一步，或直接输入",
  status: {
    referenceProcessing: "正在分析参考素材",
    profileExploring: "正在整理制作方案",
    profileEditing: (requirements: number, bounds: number) =>
      `制作方案 ${requirements} 条需求 · ${bounds} 条边界，可在右侧修改`,
    askExploring: "提问答疑中：优化建议、创作方法、背景知识",
    productionExecuting: "AI 团队正在执行制作",
  },
  replying: "正在回复…",
  interrupted: "已中断",
  productionConfirm: {
    confirm: "开始创作",
    confirmTooltip: "确认后开始执行制作，通常需要数分钟，并会消耗较多 Token",
    decline: "取消",
    declineTooltip: "暂不制作，跳过本环节并继续后续步骤",
    statusHint: "等待确认是否开始创作",
  },
  reviseConfirm: {
    confirm: "开始改稿",
    decline: "取消",
    statusHint: "等待确认是否按清单改稿",
  },
  previewSelection: {
    addToChat: "引用这段",
    tagPrefix: "「",
    removeTag: "移除引用",
    composerPlaceholder: "说明要如何修改引用的内容…",
  },
  revisionPanel: {
    trigger: (count: number) => `改稿 · ${count}`,
    dialogTitle: "改稿清单",
    dialogHint: "核对每条意见，确认无误后在对话里发起改稿。",
    dialogFooter:
      "发送「开始改稿」或「就按清单改吧」，我会按清单统一修改成稿。",
    anchoredSection: "正文引用",
    blockMarker: (count: number) => `改稿 · ${count}`,
    remove: "移除",
    unanchoredSection: "整体意见",
    empty: "还没有改稿意见，可在成稿里划词选中后说明要如何修改。",
    openList: "查看改稿清单",
  },
  composerSubmit: {
    send: "发送",
    sendTooltip: "发送消息",
    cancel: "取消",
    cancelTooltip: "取消当前回复",
  },
  stopRun: "停止",
  attachmentDrawer: {
    title: (count: number) => `附件 ${count}`,
    hint: "发送消息时一并提交",
    expand: "展开附件",
    collapse: "收起附件",
    remove: (name: string) => `移除 ${name}`,
    uploadTooltips: {
      image: "添加参考图片",
      audio: "添加参考音频",
      video: "添加参考视频",
    },
    uploading: "上传中…",
    maxReached: "最多 6 份参考素材",
  },
} as const;

/** 创作台右侧栏 */
export const CREATIVE_CONTEXT_PANEL = {
  title: "作品面板",
  hint: "制作方案、参考素材、作品内容、版本记录",
  expand: "展开作品面板",
  collapse: "收起作品面板",
  tabs: {
    profile: "方案",
    preview: "作品",
    references: "参考",
    history: "版本",
  },
} as const;

export type CreativeContextTabId = keyof typeof CREATIVE_CONTEXT_PANEL.tabs;

/** 作品面板 · 版本 */
export const WORK_HISTORY_PANEL = {
  loading: "加载版本记录…",
  exploreTitle: "平行探索",
  exploreHint:
    "换选题或换方向时，从当前最新进度复制为新作品，原作品不变。含尚未重新出稿的方案修改。",
  duplicateAction: "另存为新作品",
  duplicating: "正在创建…",
  forkFromVersion: "从此分叉为新作品",
  forkHint: "从该版出稿时的方案、参考和成稿分叉，不影响原作品。",
  timelineTitle: "版本历史",
  timelineHint:
    "每次产出作品内容时记录一版。时间轴只记成稿时刻的快照；此后对方案、参考的修改不会单独记版。",
  restoreNotice:
    "恢复某一版时，方案、参考和成稿会一起切回该版记录时的状态。若你在上次出稿后又改了方案或参考、但还没重新出稿，这些新修改会被覆盖。",
  empty: "还没有版本记录。制作产出作品后会出现。",
  headBadge: "当前",
  restore: "恢复到此版",
  restoreTitle: "恢复到此版？",
  restoreDescription: "将把这件作品切回以下版本出稿时的完整状态：",
  restoreWarningTitle: "以下内容会被覆盖",
  restoreWarningItems: [
    "制作方案 → 恢复为该版出稿时的方案",
    "参考素材 → 恢复为该版出稿时的参考",
    "作品内容 → 恢复为该版成稿",
    "上次出稿后、尚未重新出稿的方案与参考修改 → 会丢失",
  ] as const,
  restoreAlternative:
    "若想保留当前最新方案再继续改，请改用上方「另存为新作品」，或对该版本使用「从此分叉为新作品」。",
  confirmRestore: "确认恢复",
  restoring: "恢复中…",
  cancel: "取消",
} as const;

/** 作品面板 · 制作方案（步骤向导） */
export const PROFILE_WIZARD = {
  title: "制作方案",
  hint: "垂直展示全部步骤；每步内为该项已确认内容或待补充说明",
  stepsOverviewLabel: "全部步骤",
  currentStepLabel: "当前步骤",
  completedLabel: "已完成",
  skipStep: "跳过，稍后补充",
  tierRequired: "必填",
  tierRecommended: "建议",
  tierOptional: "可选",
  readyBody: "必填项已齐。可说「开始制作」进入制作，或继续补充风格、背景、需求与边界。",
  settingLabel: "背景",
  requirementsLabel: "需求",
  boundsLabel: "边界",
  clearBounds: "清空边界",
  clearSetting: "清空背景",
  clearRequirements: "清空需求",
  settingEmptyTitle: "暂无背景信息",
  settingEmptyBody:
    "可选。例如：「主角是产品经理」「虚构品牌名」「故事发生在 2030 年上海」",
  requirementsEmptyTitle: "暂无需求说明",
  requirementsEmptyBody:
    "可选。例如：「800 字」「先讲痛点 → 三款对比 → 总结推荐」",
  boundsEmptyTitle: "暂无边界说明",
  boundsEmptyBody:
    "可选。例如：「配图中不要人脸」「不要真实品牌名」",
} as const;

export const PREVIEW_PANEL = {
  title: "作品内容",
  hint: "AI 团队按方案制作的文字、画面、脚本等，显示在这里",
  unsavedBadge: "（未保存）",
  empty: "进入制作环节后，作品内容会显示在这里。",
  downloadAction: "下载资源包",
  downloading: "打包下载中…",
  downloadFailed: "下载失败，请稍后重试",
  openGallery: "查看大图",
  galleryTitle: "作品图册",
  galleryPrevious: "上一张",
  galleryNext: "下一张",
  galleryCounter: (current: number, total: number) => `${current} / ${total}`,
  galleryOpenOriginal: "在新标签页打开",
  promptLabel: "生成提示词",
  promptShow: "查看提示词",
  promptHide: "收起提示词",
} as const;

export const REFERENCE_PANEL = {
  title: "参考素材",
  hint: "上传的参考经分析后，汇总在这里",
  empty: "添加参考素材后，会显示在这里。",
  analysisLabel: "分析：",
  intentLabel: "借鉴意图：",
  typeLabels: {
    text: "文本",
    image: "图片",
    audio: "音频",
    video: "视频",
    file: "文件",
  },
  fallbackTitle: (n: number) => `参考素材 ${n}`,
  expand: "展开",
  collapse: "收起",
  openLink: "打开链接",
  openImage: "查看原图",
  openAudio: "播放音频",
  openVideo: "播放视频",
  imageUnavailable: "图片不可用",
  mediaUnavailable: "媒体不可用",
} as const;

export const PUBLISH = {
  checking: "正在检查发布状态…",
  publishedBadge: "已发布",
  previewSavedBadge: "作品已保存",
  publishButton: "发布到有感",
  publishing: "发布中…",
  confirmTitle: "确认发布",
  confirmDescription:
    "系统已根据作品内容生成推荐流摘要，确认后将完整发布所有内容块。",
  feedPreviewHeading: "发现页列表预览",
  blockCompositionHeading: "内容构成",
  previewLoading: "正在生成发布摘要…",
  previewError: "无法加载发布预览，请稍后再试",
  fieldTitle: "标题",
  fieldHook: "摘要",
  fieldCompositionLabel: "构成标签",
  fieldTopic: "主题类别",
  uploadCover: "上传列表封面",
  replaceCover: "更换列表封面",
  removeCover: "移除列表封面",
  coverPickHeading: "从作品配图中选择",
  coverPickHint: "列表封面仅用于发现页卡片；详情页顶部单独展示，正文中不再重复显示所选封面。",
  coverUploadHint: "也可点击上方卡片上传自定义封面（4:3，用于发现页列表）",
  coverUploading: "上传中…",
  coverUploadError: "封面上传失败",
  cancel: "取消",
  confirmPublish: "确认发布",
  goPublish: "去创作台开始制作",
  emptyPublications: "还没有发布过的内容",
} as const;
