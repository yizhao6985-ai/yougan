import type { AgentStateType } from "#agent/state.js";

const PLACEHOLDER_WORK_TITLES = new Set(["未命名作品", "（未命名作品）"]);

export function isPlaceholderWorkTitle(title: string | undefined): boolean {
  const trimmed = title?.trim();
  if (!trimmed) return true;
  return PLACEHOLDER_WORK_TITLES.has(trimmed);
}

export function resolveWorkTitle(title: string | undefined): string {
  return title?.trim() || "（未命名作品）";
}

export function buildWorkTitleSection(state: AgentStateType): string {
  const workTitle = resolveWorkTitle(state.workTitle);
  const lines = [`## 作品标题（本件作品要产出的内容）`, workTitle];

  if (!isPlaceholderWorkTitle(state.workTitle)) {
    lines.push(
      "",
      "- 把标题整体理解为用户想完成的**那一件作品**（体裁、对象、用途均在标题中）",
      "- 每条延伸方向须帮助用户着手写/做标题所指内容，互斥但同属该作品",
      "- 禁止把标题拆成关键词后发散成同领域泛选题清单",
    );
  }

  return lines.join("\n");
}
