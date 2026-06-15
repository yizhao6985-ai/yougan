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
  taglineLanding: "AI 创作助手",
  taglineApp: "方案 · 制作 · 提问",
  metaDescription:
    "有感 Yougan — AI 创作助手。先定制作方案，再由 AI 团队按计划制作文字、画面、音视频等作品，全程可确认、可修改、可回溯。",
  documentTitle: "有感 · Yougan — AI 创作助手",
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
  productLink: "了解产品能力",
  contactTitle: "联系我们",
  contactBody:
    "产品反馈、商务合作或媒体咨询，欢迎发送邮件。我们会在工作日尽快回复。",
  contactEmail: "hello@yougan.com",
  ctaStudio: "开始创作",
  ctaFeatures: "了解产品能力",
} as const;

export const HOME = {
  eyebrow: BRAND.en,
  title: "有感",
  titleSuffix: "AI 创作助手",
  subtitle:
    "先想清楚，再开始创作。文章、插画、脚本与音视频，AI 团队陪你一步步完成，过程看得明白，想改也随时能改。",
  ctaStudio: "开始创作",
  ctaFeatures: "了解产品能力",
  capabilitiesTitle: "定方案、去制作、随时问",
  capabilitiesLink: "查看说明 →",
} as const;

export const FEATURES_PAGE = {
  back: "返回首页",
  eyebrow: "产品能力",
  title: "从定方案到作品产出",
  subtitle:
    "不跳过确认环节。先整理制作方案，AI 团队排计划并执行；制作中可随时提问、调整方案，对话里持续迭代。",
  platformsIntro: "支持的创作形态",
  workflowTitle: "推荐使用流程",
  workflowSubtitle: "从新建作品到可以发布，建议按以下步骤",
  capabilitiesDetailTitle: "能帮你做什么",
  capabilitiesDetailSubtitle:
    "通过对话推进各环节，系统会在背后整理方案、执行制作、回答问题。",
  studioTitle: "创作台布局",
  studioSubtitle: "左侧作品列表、中间对话、右侧作品面板（方案 / 参考 / 作品 / 版本）",
  capabilityBenefitsHeading: "会帮你做",
  capabilityLimitsHeading: "这一步不做",
  ctaStudio: "打开创作台",
  ctaMobile: "下载手机 App",
} as const;

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
  ctaFeatures: "了解产品能力",
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
    "浏览创作者公开分享的作品，从故事、干货到笔记与视听内容，找灵感、看写法。",
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
  registerTitle: "创建账号",
  loginFormSubtitle: "使用邮箱登录，继续你的创作",
  registerFormSubtitle: "注册后作品与制作记录将云端保存",
  loginSubtitle: "作品与制作记录云端保存，换设备可继续同一流程",
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
    "查看当前套餐与 AI 创作额度。升级 Pro / Pro+ 获得更高额度、旗舰出稿与平台发布。",
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
  emptyWorksList: "还没有作品，创建一件并从定方案开始。",
  emptyWorksFiltered: "创建一件作品，从定方案开始。",
  referencesCount: (n: number) => `已添加 ${n} 条参考素材`,
  publishViewInDiscover: (sectionTitle: string) => `在${sectionTitle}查看`,
  modelTemperatureLabel: "创意度",
  modelTemperatureHint:
    "调节制作环节 AI 的发散程度（文字、视觉等）。不影响定方案、提问与制作计划。",
} as const;

export const CHAT_COPY = {
  openingSuggestionsLoading: "正在生成下一步建议…",
  openingSuggestionsEmpty: "暂无合适建议，请在下方输入",
  placeholderDefault: "说说想法、提问，或说明要改方案 / 改作品…",
  emptyTitle: "选择下一步，或直接输入",
  status: {
    referenceProcessing: "正在分析参考素材",
    profileExploring: "正在整理制作方案",
    profileEditing: (segments: number, rules: number) =>
      `制作方案 ${segments} 节 · ${rules} 条规则，可在右侧修改`,
    askExploring: "提问答疑中：优化建议、创作方法、背景知识",
    productionExecuting: "AI 团队正在执行制作",
  },
  replying: "正在回复…",
  interrupted: "已中断",
  productionConfirm: {
    durationHint: "成稿制作会调用多个 AI 步骤，通常需要数分钟，请保持页面打开。",
    confirm: "开始创作",
    decline: "取消",
    statusHint: "等待确认是否开始创作",
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
  duplicateTitle: "另存为新作品",
  duplicateHint:
    "需要换主题或换方向时，从当前进度复制为新作品，不影响原作品。",
  duplicateAction: "另存为新作品",
  duplicating: "正在创建…",
  duplicateFromHere: "从此版本复制",
  timelineTitle: "版本记录",
  timelineHint: "每次产出作品内容后会记录一版，可回到任意版本继续编辑。",
  empty: "还没有版本记录。制作产出作品后会出现。",
  headBadge: "当前",
  restore: "回到这一版",
  restoreTitle: "回到这一版？",
  restoreDescription:
    "将切换到所选版本，当前进度会被替换，历史记录保留。",
  confirmRestore: "确认回到这一版",
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
  readyBody: "必填项已齐。可说「开始制作」进入制作，或继续补充表达、结构与规则。",
  settingsLabel: "固定设定",
  segmentsLabel: "结构大纲",
  clearConstraints: "清空规则",
  clearSettings: "清空设定",
  clearSegments: "清空大纲",
  settingsEmptyTitle: "暂无固定设定",
  settingsEmptyBody:
    "可选。例如：「主角是刚入行的产品经理」或「背景设定在 2030 年」",
  segmentsEmptyTitle: "暂无结构大纲",
  segmentsEmptyBody:
    "可选。例如：「开头钩子 → 主体展开 → 结尾号召」，或分镜顺序",
  settingKindLabels: {
    character: "对象",
    world: "背景",
    other: "其他",
  } as const,
} as const;

export const PREVIEW_PANEL = {
  title: "作品内容",
  hint: "AI 团队按方案制作的文字、画面、脚本等，显示在这里",
  unsavedBadge: "（未保存）",
  empty: "进入制作环节后，作品内容会显示在这里。",
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
  confirmTitle: "确认发布分类",
  confirmDescription:
    "系统已根据作品内容推断分类标签，你可修改后发布，便于他人在发现页找到。",
  inferredTags: "推断标签",
  previewLoading: "正在分析内容分类…",
  previewError: "无法加载分类预览，请稍后再试",
  fieldFormat: "内容体裁",
  fieldTopic: "主题类别",
  fieldMedia: "媒介形态",
  fieldPlatform: "发布渠道（可选）",
  cancel: "取消",
  confirmPublish: "确认发布",
  goPublish: "去创作台开始制作",
  emptyPublications: "还没有发布过的内容",
} as const;
