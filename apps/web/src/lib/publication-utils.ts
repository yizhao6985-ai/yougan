import { formatAccountLabel } from "@yougan/domain";

import type { Publication } from "@/lib/publication-types";

export function authorDisplayName(author?: Publication["author"]) {
  if (!author) return "匿名作者";
  return formatAccountLabel(author);
}
