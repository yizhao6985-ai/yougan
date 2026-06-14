# @yougan/help-chat

有感产品知识 RAG 客服浮层。通过 AG-UI Protocol 连接 RAG 服务（默认 `http://localhost:8000/api/v1/chat`）。

## 导出

- `HelpChatWidget` — Header 入口 + 悬浮聊天窗（Web 直接引入）
- `HelpChatProvider` / `useHelpChatConfig` — 可选全局配置
- `useHelpChat` — 聊天状态 hook（自定义 UI 时使用）

## 约定

- 样式使用 Tailwind + 宿主应用的 CSS 变量（`bg-background` 等）
- Web 需在 `index.css` 添加 `@source` 扫描本包源码
- API 地址通过 `apiUrl` prop 或 Provider 注入，勿在包内写死生产 URL
