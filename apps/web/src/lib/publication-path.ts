/** 公开内容详情页路径 */
export function publicationContentPath(slug: string): string {
  return `/content/${encodeURIComponent(slug)}`;
}
