# Yougan Web (Vite + React)

- 源码在 `src/`：`pages/`、`components/`、`lib/`
- **样式**：Tailwind CSS v4 + `@tailwindcss/vite`；设计 token 在 `src/index.css`（`@theme inline`）；组件用 `cn()`（`tailwind-merge` + `clsx`）
- **UI 组件**：shadcn/ui（`src/components/ui/`）+ AI Elements（`src/components/ai-elements/`）
- **文件命名**：统一使用 kebab-case（如 `yougan-chat.tsx`、`use-yougan-stream.ts`）；组件/函数导出仍用 PascalCase
- 路由：`react-router-dom`（`/` 落地页，`/studio` 创作台）
- 聊天数据层：`@langchain/langgraph-sdk/react` 的 `useStream`
- 环境变量：`VITE_*`（如 `VITE_API_BASE_URL`、`VITE_LANGGRAPH_API_URL`）
- 上传 / 静态资源 / 鉴权：走 `apps/api`，客户端在 `src/lib/api/`
- 默认开发端口：`3000`
