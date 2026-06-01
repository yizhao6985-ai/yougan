# @yougan/web

Vite + React 19 前端：产品介绍落地页、公开内容阅读、用户设置，以及 `/studio` AI 创作台。

默认开发地址：`http://localhost:3000`

## 职责

- 营销与功能介绍页（`/`、`/features`、`/mobile`）
- 登录注册与邮箱确认、密码重置
- **Studio**（`/studio`）：作品侧栏、三模式对话（共享作品状态）、历史 tab、另存为新作品
- 设置中心（`/settings/*`）：资料、账号、会员、账单、作品、发布、平台集成
- 公开内容流（`/content`）与用户主页（`/user/:userId`、`/profile`）

所有业务数据与上传走 `apps/api`；对话流使用 LangGraph SDK，经 API 的 `/langgraph` 代理。

## 开发

在 monorepo 根目录：

```bash
cp apps/web/.env.local.example apps/web/.env.local
pnpm install
pnpm dev:web
```

需同时启动 API（`pnpm dev:api`）、Agent（`pnpm dev:agent`）才能使用 Studio 对话。

## 脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | Vite 开发服务器（HMR） |
| `pnpm build` | `tsc` 类型检查 + 生产构建 → `dist/` |
| `pnpm preview` | 预览生产构建 |
| `pnpm lint` | ESLint |
| `pnpm check-types` | TypeScript 检查（app + vite 配置） |
| `pnpm generate:api` | 从 `../api/openapi/openapi.json` 生成 `src/services/generated/schema.d.ts` |

在仓库根目录可用 `pnpm generate:api`（会先触发 API 的 `openapi:generate`）。

## 环境变量

`.env.local`（见 `.env.local.example`）：

| 变量 | 说明 |
|------|------|
| `VITE_API_BASE_URL` | REST API 根地址，默认 `http://localhost:4000` |
| `VITE_LANGGRAPH_API_URL` | LangGraph 代理地址，默认 `http://localhost:4000/langgraph` |
| `VITE_MOBILE_DOWNLOAD_URL` | 可选，移动端下载页（产品介绍扫码） |
| `VITE_MOBILE_IOS_DOWNLOAD_URL` | 可选，iOS App Store |
| `VITE_MOBILE_ANDROID_DOWNLOAD_URL` | 可选，Android 应用商店 |
| `VITE_FEEDBACK_EMAIL` | 可选，反馈邮件收件地址，默认 `hello@yougan.com` |

以 `VITE_` 开头的变量在构建时注入，修改后需重启 dev server。

## 路由

| 路径 | 说明 | 需登录 |
|------|------|--------|
| `/` | 首页 | 否 |
| `/features` | 功能介绍 | 否 |
| `/mobile` | 移动端下载 | 否 |
| `/content` | 公开内容列表 | 否 |
| `/content/:slug` | 内容详情 | 否 |
| `/user/:userId` | 用户公开主页 | 否 |
| `/profile` | 当前用户主页 | 是 |
| `/login` | 登录 | 否 |
| `/forgot-password` | 忘记密码 | 否 |
| `/reset-password` | 重置密码 | 否 |
| `/confirm-email` | 邮箱确认 | 否 |
| `/feedback` | 产品问题反馈 | 否 |
| `/studio` | 创作台 | 是 |
| `/settings/profile` | 资料与外观 | 是 |
| `/settings/account` | 账号与安全 | 是 |
| `/settings/membership` | 会员计划 | 是 |
| `/settings/billing` | 账单记录 | 是 |
| `/settings/works` | 作品管理 | 是 |
| `/settings/publications` | 我的发布 | 是 |
| `/settings/integrations` | 平台 OAuth | 是 |

## 目录结构

```
apps/web/src/
├── main.tsx / app.tsx          # 入口与路由
├── pages/                      # 页面级组件
│   ├── auth-pages.tsx          # Studio 路由守卫
│   ├── settings/               # 设置子页
│   ├── content/                # 公开内容
│   └── user/                   # 用户主页
├── components/
│   ├── studio/                 # 创作台（聊天、侧栏、作品树）
│   ├── settings/               # 设置面板
│   ├── content/                # 内容展示卡片
│   ├── profile/                # 主页区块
│   ├── ai-elements/            # 对话 UI 基元
│   └── ui/                     # shadcn 风格组件
├── hooks/
│   ├── use-yougan-stream.ts    # LangGraph useStream 封装
│   ├── queries/                # TanStack Query hooks
│   └── use-works-store.ts      # 作品侧栏状态
├── services/                   # REST 客户端（auth、works、publications…）
│   └── generated/schema.d.ts   # OpenAPI 生成类型
├── store/                      # Jotai / 本地 auth 状态
└── lib/                        # 环境变量、LangGraph 客户端、文案与工具函数
```

## 与 API / Agent 的集成

**REST**（`src/services/`）：

- 使用 `VITE_API_BASE_URL` 请求 `/api/*`
- JWT 存于本地，由 auth store 附加到请求头
- 类型来自 `generate:api` 生成的 `schema.d.ts`

**对话流**（`src/hooks/use-yougan-stream.ts`、`src/lib/langgraph-client.ts`）：

- LangGraph SDK `useStream` 指向 `VITE_LANGGRAPH_API_URL`
- 请求携带 `Authorization` 与当前作品的 `X-Work-Id`
- 流式更新与工具调用 UI 在 `components/studio/` 中渲染

## 状态管理

| 用途 | 方案 |
|------|------|
| 服务端数据 | TanStack Query（`hooks/queries/`） |
| Studio UI、认证令牌 | Jotai + `store/` |
| 作品列表与选中项 | `use-works-store` + API 同步 |

## 技术栈

- **框架**：React 19、React Router 7、Vite 6
- **样式**：Tailwind CSS v4（`@tailwindcss/vite`）、`tw-animate-css`
- **组件**：Radix UI、cmdk、lucide-react、motion
- **对话 UI**：`streamdown`、自定义 `ai-elements`
- **AI**：`@langchain/langgraph-sdk`、`ai` 包部分能力
- **类型**：openapi-typescript 生成的 API schema

## 生产构建

```bash
pnpm build
```

将 `dist/` 部署到静态托管（Nginx、Vercel、OSS 等）。构建时需传入正确的 `VITE_API_BASE_URL` 与 `VITE_LANGGRAPH_API_URL` 指向生产 API。

## 相关文档

- [根目录 README](../../README.md)
- [apps/api/README.md](../api/README.md)
- [apps/agent/README.md](../agent/README.md)
