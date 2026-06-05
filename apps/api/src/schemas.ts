import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { REVISION_KINDS, USER_REVISION_PHASES } from "@yougan/domain";

extendZodWithOpenApi(z);

export const ReferenceItemSchema = z
  .object({
    source_type: z.enum(["text", "image", "web"]),
    summary: z.string(),
    keywords: z.array(z.string()).optional(),
    tone_hints: z.array(z.string()).optional(),
    structure_hints: z.array(z.string()).optional(),
    hashtags: z.array(z.string()).optional(),
    raw_excerpt: z.string().nullable().optional(),
    image_url: z.string().nullable().optional(),
    url: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
  })
  .openapi("ReferenceItem");

export const WorkReferencesSchema = z
  .array(ReferenceItemSchema)
  .openapi("WorkReferences");

export const WorkProfileSchema = z
  .object({
    spec: z.object({
      platform: z.string().nullable().optional(),
      content_topic: z.string().nullable().optional(),
      content_type: z.string().nullable().optional(),
      content_format: z.string().nullable().optional(),
      media_modalities: z.array(z.string()).optional(),
    }),
    voice: z.object({
      audience: z.string().nullable().optional(),
      tone: z.string().nullable().optional(),
      style: z.string().nullable().optional(),
      persona: z.string().nullable().optional(),
      goals: z.array(z.string()).optional(),
    }),
    premise: z.string(),
    references: WorkReferencesSchema,
    constraints: z.array(
      z.object({
        id: z.string(),
        description: z.string(),
        confirmed_at: z.string(),
      }),
    ),
    beats: z.array(
      z.object({
        id: z.string(),
        description: z.string(),
        intent: z.string().nullable().optional(),
        confirmed_at: z.string(),
      }),
    ),
  })
  .openapi("WorkProfile");

export const WorkProductionPlanSchema = z
  .object({
    pending_tasks: z.array(
      z.object({
        id: z.string(),
        description: z.string(),
        created_at: z.string(),
        department: z.enum(["writing", "design", "audio", "video"]).optional(),
        status: z.enum(["pending", "in_progress", "completed"]).optional(),
        assignee: z.string().nullable().optional(),
      }),
    ),
    executed_tasks: z.array(
      z.object({
        id: z.string(),
        description: z.string(),
        executed_at: z.string(),
        batch_summary: z.string().nullable().optional(),
        department: z.enum(["writing", "design", "audio", "video"]).optional(),
        assignee: z.string().nullable().optional(),
      }),
    ),
    last_execution_summary: z.string().nullable().optional(),
    ready: z.boolean().optional(),
    summary: z.string().nullable().optional(),
    departments: z
      .array(z.enum(["writing", "design", "audio", "video"]))
      .optional(),
    industry_context: z.string().nullable().optional(),
    director_notes: z.string().nullable().optional(),
  })
  .openapi("WorkProductionPlan");

export const WorkPreviewSchema = z
  .object({
    platform: z.string(),
    title: z.string().nullable().optional(),
    body: z.string(),
    hashtags: z.array(z.string()).optional(),
    hook: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    images: z
      .array(
        z.object({
          url: z.string().url(),
          alt: z.string().nullable().optional(),
          prompt: z.string().nullable().optional(),
        }),
      )
      .optional(),
    publish_ready: z.boolean().optional(),
  })
  .openapi("WorkPreview");


export const WorkRevisionSnapshotSchema = z
  .object({
    profile: WorkProfileSchema,
    productionPlan: WorkProductionPlanSchema,
    preview: WorkPreviewSchema.nullable(),
  })
  .openapi("WorkRevisionSnapshot");

export const WorkRevisionSchema = z
  .object({
    id: z.string(),
    workId: z.string(),
    parentRevisionId: z.string().nullable(),
    conversationId: z.string().nullable(),
    kind: z.enum(REVISION_KINDS),
    phase: z.enum(USER_REVISION_PHASES),
    summary: z.string(),
    snapshot: WorkRevisionSnapshotSchema,
    createdAt: z.string(),
  })
  .openapi("WorkRevision");

export const WorkGroupSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("WorkGroup");

export const WorkSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    groupId: z.string().nullable(),
    profile: WorkProfileSchema,
    productionPlan: WorkProductionPlanSchema,
    preview: WorkPreviewSchema.nullable(),
    headRevisionId: z.string().nullable(),
    sourceWorkId: z.string().nullable(),
    sourceRevisionId: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("Work");

export const WorkConversationSchema = z
  .object({
    id: z.string(),
    workId: z.string(),
    title: z.string(),
    threadId: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("WorkConversation");

export const UserSchema = z
  .object({
    id: z.string(),
    email: z.string().email(),
    name: z.string().nullable(),
    bio: z.string().nullable(),
    avatarUrl: z.string().url().nullable(),
    coverUrl: z.string().url().nullable(),
    createdAt: z.string(),
  })
  .openapi("User");

export const UserProfileStatsSchema = z
  .object({
    publicationCount: z.number(),
    totalViews: z.number(),
    publicationsByMonth: z.array(
      z.object({
        month: z.string(),
        count: z.number(),
      }),
    ),
  })
  .openapi("UserProfileStats");

export const AuthTokenSchema = z
  .object({
    token: z.string(),
    user: UserSchema,
  })
  .openapi("AuthToken");

export const ErrorSchema = z
  .object({ error: z.string() })
  .openapi("Error");

export const UploadResponseSchema = z
  .object({ url: z.string(), key: z.string() })
  .openapi("UploadResponse");

export const SyncWorkStateSchema = z
  .object({
    groupId: z.string().nullable().optional(),
    profile: WorkProfileSchema.optional(),
    productionPlan: WorkProductionPlanSchema.optional(),
    preview: WorkPreviewSchema.nullable().optional(),
    title: z.string().optional(),
  })
  .openapi("SyncWorkState");

export const SyncWorkConversationSchema = z
  .object({
    title: z.string().optional(),
    threadId: z.string().nullable().optional(),
  })
  .openapi("SyncWorkConversation");

export const AgentContextSchema = z
  .object({
    workId: z.string(),
    conversationId: z.string().optional(),
    headRevisionId: z.string().nullable().optional(),
    profile: WorkProfileSchema,
    productionPlan: WorkProductionPlanSchema,
    preview: WorkPreviewSchema.nullable(),
    threadId: z.string().nullable().optional(),
    workTitle: z.string().optional(),
    conversationTitle: z.string().optional(),
  })
  .openapi("AgentContext");

export type WorkDTO = z.infer<typeof WorkSchema>;
export type WorkConversationDTO = z.infer<typeof WorkConversationSchema>;
export type WorkGroupDTO = z.infer<typeof WorkGroupSchema>;
export type WorkRevisionDTO = z.infer<typeof WorkRevisionSchema>;

export const UpdateProfileSchema = z
  .object({
    name: z.string().optional(),
    bio: z.string().max(160).optional(),
    avatarUrl: z.string().url().nullable().optional(),
    coverUrl: z.string().url().nullable().optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6).optional(),
  })
  .openapi("UpdateProfile");

export const PlatformIntegrationSchema = z
  .object({
    id: z.string(),
    platform: z.string(),
    accountName: z.string().nullable(),
    accountId: z.string().nullable(),
    status: z.string(),
    scopes: z.array(z.string()),
    tokenExpiresAt: z.string().nullable(),
    connectedAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("PlatformIntegration");

export const PlatformCatalogItemSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    description: z.string(),
    oauthConfigured: z.boolean(),
    connected: z.boolean(),
    integration: PlatformIntegrationSchema.nullable(),
  })
  .openapi("PlatformCatalogItem");

export type PlatformIntegrationDTO = z.infer<typeof PlatformIntegrationSchema>;

export const PublicationStatusSchema = z.enum([
  "draft",
  "published",
  "archived",
]);

export const PublicationAuthorSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().email(),
  bio: z.string().nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export const PublicationSchema = z
  .object({
    id: z.string(),
    workId: z.string().nullable(),
    slug: z.string(),
    title: z.string(),
    excerpt: z.string().nullable(),
    body: z.string(),
    coverUrl: z.string().url().nullable(),
    platform: z.string().nullable(),
    contentFormat: z.string().nullable(),
    topicCategory: z.string().nullable(),
    contentTopic: z.string().nullable(),
    contentType: z.string().nullable(),
    mediaTypes: z.array(z.string()),
    hashtags: z.array(z.string()),
    images: z.array(z.object({ url: z.string().url() })),
    status: PublicationStatusSchema,
    publishedAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    author: PublicationAuthorSchema.optional(),
  })
  .openapi("Publication");

export type PublicationDTO = z.infer<typeof PublicationSchema>;
export type PublicationStatus = z.infer<typeof PublicationStatusSchema>;

export const SubscriptionPlanSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    monthlyAiQuota: z.number(),
    priceMonthlyLabel: z.string(),
    priceYearlyLabel: z.string(),
    priceMonthlyCents: z.number(),
    priceYearlyCents: z.number(),
    features: z.array(z.string()),
    highlighted: z.boolean(),
  })
  .openapi("SubscriptionPlan");

export const SubscriptionSummarySchema = z
  .object({
    planId: z.string(),
    planName: z.string(),
    planDescription: z.string(),
    status: z.string(),
    billingCycle: z.enum(["monthly", "yearly"]).nullable(),
    currentPeriodStart: z.string(),
    currentPeriodEnd: z.string().nullable(),
    aiUsageThisPeriod: z.number(),
    aiQuotaThisPeriod: z.number(),
    cancelAtPeriodEnd: z.boolean(),
    features: z.array(z.string()),
  })
  .openapi("SubscriptionSummary");

export const BillingOrderSchema = z
  .object({
    id: z.string(),
    planId: z.string(),
    planName: z.string(),
    billingCycle: z.enum(["monthly", "yearly"]),
    amountCents: z.number(),
    amountLabel: z.string(),
    currency: z.string(),
    status: z.string(),
    description: z.string(),
    paidAt: z.string().nullable(),
    createdAt: z.string(),
  })
  .openapi("BillingOrder");

export const CheckoutSubscriptionSchema = z
  .object({
    planId: z.enum(["pro"]),
    billingCycle: z.enum(["monthly", "yearly"]),
  })
  .openapi("CheckoutSubscription");
