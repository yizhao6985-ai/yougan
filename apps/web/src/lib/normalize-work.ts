import type { Work, WorkWire } from "@/services/types";
import { normalizeWorkDto } from "@yougan/domain";

export function normalizeWork(work: WorkWire): Work {
  return normalizeWorkDto(work) as Work;
}
