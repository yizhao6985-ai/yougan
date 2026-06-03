import type { Work } from "@/lib/types";
import { normalizeWorkDto } from "@yougan/domain";

export function normalizeWork(work: Work): Work {
  return normalizeWorkDto(work);
}
