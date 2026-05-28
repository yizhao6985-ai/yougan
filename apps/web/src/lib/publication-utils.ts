import type { Publication } from "@/lib/publication-types";

export function authorDisplayName(author?: Publication["author"]) {
  if (!author) return "匿名作者";
  if (author.name?.trim()) return author.name.trim();
  return author.email.split("@")[0] || "作者";
}
