import { ABOUT_PAGE } from "@/lib/site-copy";

export type FeedbackCategory = "bug" | "feature" | "question" | "other";

export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: "功能异常 / Bug",
  feature: "功能建议",
  question: "使用疑问",
  other: "其他",
};

export const FEEDBACK_DRAFT_KEY = "yougan:feedback-draft";

export const FEEDBACK_EMAIL =
  import.meta.env.VITE_FEEDBACK_EMAIL ?? ABOUT_PAGE.contactEmail;

export type FeedbackDraft = {
  category: FeedbackCategory;
  description: string;
  contactEmail: string;
};

export type FeedbackContext = {
  pageUrl: string;
  userAgent: string;
  userId?: string;
  userEmail?: string;
};

export function formatFeedbackBody(
  draft: FeedbackDraft,
  context: FeedbackContext,
): string {
  const lines = [
    "【有感 · Yougan 产品反馈】",
    "",
    `反馈类型：${FEEDBACK_CATEGORY_LABELS[draft.category]}`,
    `联系邮箱：${draft.contactEmail.trim() || "（未填写）"}`,
    "",
    "—— 反馈内容 ——",
    draft.description.trim(),
    "",
    "—— 环境信息（便于排查）——",
    `页面：${context.pageUrl}`,
    `时间：${new Date().toLocaleString("zh-CN", { hour12: false })}`,
  ];

  if (context.userId) {
    lines.push(`用户 ID：${context.userId}`);
  }
  if (context.userEmail) {
    lines.push(`登录邮箱：${context.userEmail}`);
  }
  lines.push(`浏览器：${context.userAgent}`);

  return lines.join("\n");
}

export function feedbackMailtoSubject(category: FeedbackCategory): string {
  return `[有感反馈] ${FEEDBACK_CATEGORY_LABELS[category]}`;
}

export function buildFeedbackMailto(body: string, category: FeedbackCategory): string {
  const params = new URLSearchParams({
    subject: feedbackMailtoSubject(category),
    body,
  });
  return `mailto:${FEEDBACK_EMAIL}?${params.toString()}`;
}

export function readFeedbackDraft(): FeedbackDraft | null {
  try {
    const raw = localStorage.getItem(FEEDBACK_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FeedbackDraft;
    if (
      typeof parsed.category === "string" &&
      typeof parsed.description === "string" &&
      typeof parsed.contactEmail === "string" &&
      parsed.category in FEEDBACK_CATEGORY_LABELS
    ) {
      return parsed;
    }
  } catch {
    // ignore corrupt draft
  }
  return null;
}

export function writeFeedbackDraft(draft: FeedbackDraft | null) {
  if (!draft || (!draft.description.trim() && !draft.contactEmail.trim())) {
    localStorage.removeItem(FEEDBACK_DRAFT_KEY);
    return;
  }
  localStorage.setItem(FEEDBACK_DRAFT_KEY, JSON.stringify(draft));
}

export async function copyFeedbackToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
