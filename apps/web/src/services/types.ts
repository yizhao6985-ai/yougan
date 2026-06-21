import type { components } from "@/services/generated/schema";
import type {
  WorkPreview,
  WorkProduction,
  WorkProfile,
  WorkReference,
  WorkRevision,
} from "@yougan/domain";

export type { AuthUser } from "@/services/auth";

/** OpenAPI 契约类型（权威来源：apps/api/schemas.ts → openapi.json） */

/** API 原始 JSON（fetch 后、normalize 前） */
export type WorkWire = components["schemas"]["Work"];

/**
 * 应用内作品：OpenAPI 外壳 + domain 嵌套字段（normalize 后与 Agent state 对齐）。
 */
export type Work = Omit<
  WorkWire,
  "profile" | "references" | "preview" | "revision" | "production"
> & {
  profile: WorkProfile;
  references: WorkReference[];
  preview: WorkPreview | null;
  revision: WorkRevision;
  production: WorkProduction;
};

export type WorkVersion = components["schemas"]["WorkVersion"];
export type WorkVersionSnapshot = components["schemas"]["WorkVersionSnapshot"];
export type WorkGroup = components["schemas"]["WorkGroup"];
export type SyncWorkState = components["schemas"]["SyncWorkState"];
export type AgentContext = components["schemas"]["AgentContext"];
export type UploadResponse = components["schemas"]["UploadResponse"];
