import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

/** 创作模式：灵感 → 创作 → 提问 */
export const CHAT_MODES = ["inspiration", "creation", "ask"] as const;

export const ChatModeSchema = z.enum(CHAT_MODES);

export const WorkProfileSchema = z
  .object({
    platform: z.string().nullable().optional(),
    content_topic: z.string().nullable().optional(),
    content_type: z.string().nullable().optional(),
    content_format: z.string().nullable().optional(),
    media_modality: z.string().nullable().optional(),
    content_points: z.array(z.string()).optional(),
    style: z.string().nullable().optional(),
    tone: z.string().nullable().optional(),
    persona: z.string().nullable().optional(),
    audience: z.string().nullable().optional(),
    goals: z.array(z.string()).optional(),
    style_constraints: z.array(z.string()).optional(),
    notes: z.string().nullable().optional(),
    references: z.array(z.record(z.unknown())).optional(),
  })
  .openapi("WorkProfile");

export const WorkOutlineSchema = z
  .object({
    pending_changes: z.array(
      z.object({
        id: z.string(),
        description: z.string(),
        created_at: z.string(),
        department: z.enum(["writing", "design", "audio", "video"]).optional(),
        status: z.enum(["pending", "in_progress", "completed"]).optional(),
        assignee: z.string().nullable().optional(),
      }),
    ),
    executed_changes: z.array(
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
    plan_ready: z.boolean().optional(),
    plan_summary: z.string().nullable().optional(),
    departments: z
      .array(z.enum(["writing", "design", "audio", "video"]))
      .optional(),
    industry_context: z.string().nullable().optional(),
    creative_director_notes: z.string().nullable().optional(),
    outline_ready: z.boolean().optional(),
    outline_summary: z.string().nullable().optional(),
  })
  .openapi("WorkOutline");

export const WorkInspirationSchema = z
  .object({
    confirmed_requirements: z.array(
      z.object({
        id: z.string(),
        description: z.string(),
        confirmed_at: z.string(),
      }),
    ),
    summary: z.string().nullable().optional(),
    inspiration_ready: z.boolean().optional(),
    summarized_at: z.string().nullable().optional(),
  })
  .openapi("WorkInspiration");

export const GeneratedContentSchema = z
  .object({
    platform: z.string(),
    title: z.string().nullable().optional(),
    body: z.string(),
    hashtags: z.array(z.string()).optional(),
    hook: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    images: z.array(z.record(z.unknown())).optional(),
    publish_ready: z.boolean().optional(),
  })
  .openapi("GeneratedContent");

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
    outline: WorkOutlineSchema,
    inspiration: WorkInspirationSchema,
    creation: GeneratedContentSchema.nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("Work");

export const WorkConversationSchema = z
  .object({
    id: z.string(),
    workId: z.string(),
    title: z.string(),
    mode: ChatModeSchema,
    threadId: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("WorkConversation");

export const InspirationRecommendationSchema = z
  .object({
    id: z.string(),
    suggestion: z.string(),
  })
  .openapi("InspirationRecommendation");

export type InspirationRecommendation = z.infer<
  typeof InspirationRecommendationSchema
>;

export const WorkInspirationRecommendationsSchema = z
  .object({
    workId: z.string(),
    title: z.string(),
    recommendations: z.array(InspirationRecommendationSchema).min(1).max(3),
  })
  .openapi("WorkInspirationRecommendations");

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

export const PublicUserSchema = z
  .object({
    id: z.string(),
    name: z.string().nullable(),
    bio: z.string().nullable(),
    avatarUrl: z.string().url().nullable(),
    coverUrl: z.string().url().nullable(),
    publicationCount: z.number().int(),
  })
  .openapi("PublicUser");

export const UserProfileStatsSchema = z
  .object({
    publicationCount: z.number().int(),
    totalViews: z.number().int(),
    publicationsByMonth: z.array(
      z.object({
        month: z.string(),
        count: z.number().int(),
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
    outline: WorkOutlineSchema.optional(),
    inspiration: WorkInspirationSchema.optional(),
    creation: GeneratedContentSchema.nullable().optional(),
    title: z.string().optional(),
  })
  .openapi("SyncWorkState");

export const SyncWorkConversationSchema = z
  .object({
    title: z.string().optional(),
    mode: ChatModeSchema.optional(),
    threadId: z.string().nullable().optional(),
  })
  .openapi("SyncWorkConversation");

export const AgentContextSchema = z
  .object({
    workId: z.string(),
    conversationId: z.string().optional(),
    mode: ChatModeSchema,
    profile: WorkProfileSchema,
    outline: WorkOutlineSchema,
    inspiration: WorkInspirationSchema,
    creation: GeneratedContentSchema.nullable(),
    threadId: z.string().nullable().optional(),
    title: z.string().optional(),
  })
  .openapi("AgentContext");

export type WorkDTO = z.infer<typeof WorkSchema>;
export type WorkConversationDTO = z.infer<typeof WorkConversationSchema>;
export type WorkGroupDTO = z.infer<typeof WorkGroupSchema>;

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
  bio: z.string().nullable(),
  avatarUrl: z.string().nullable().optional(),
});

export const PublicationSchema = z
  .object({
    id: z.string(),
    workId: z.string().nullable(),
    slug: z.string(),
    title: z.string(),
    excerpt: z.string().nullable(),
    body: z.string(),
    coverUrl: z.string().nullable(),
    platform: z.string().nullable(),
    contentFormat: z.string().nullable(),
    topicCategory: z.string().nullable(),
    contentTopic: z.string().nullable(),
    contentType: z.string().nullable(),
    mediaType: z.string().nullable(),
    hashtags: z.array(z.string()),
    images: z.array(z.record(z.unknown())),
    status: PublicationStatusSchema,
    publishedAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    author: PublicationAuthorSchema.optional(),
  })
  .openapi("Publication");

export type PublicationStatus = z.infer<typeof PublicationStatusSchema>;
export type PublicationDTO = z.infer<typeof PublicationSchema>;

export const SubscriptionPlanSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    monthlyAiQuota: z.number().int(),
    priceMonthlyLabel: z.string(),
    priceYearlyLabel: z.string(),
    priceMonthlyCents: z.number().int(),
    priceYearlyCents: z.number().int(),
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
    aiUsageThisPeriod: z.number().int(),
    aiQuotaThisPeriod: z.number().int(),
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
    amountCents: z.number().int(),
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
