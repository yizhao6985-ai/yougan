import { lazy, type ComponentType } from "react";

/** 懒加载具名导出的页面/布局组件（配合 React Router + Suspense） */
export function lazyNamed<
  TModule extends Record<string, ComponentType<unknown>>,
  TKey extends keyof TModule,
>(factory: () => Promise<TModule>, name: TKey) {
  return lazy(() =>
    factory().then((module) => ({
      default: module[name] as ComponentType<unknown>,
    })),
  );
}
