import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const AssetSchema = z
  .object({
    key: z.string(),
    url: z.string(),
    mime_type: z.string(),
    size_bytes: z.number().nullable().optional(),
    original_name: z.string().nullable().optional(),
  })
  .openapi("Asset");

const ReferenceAnalysisSchema = z.object({
  summary: z.string(),
  keywords: z.array(z.string()).optional(),
  tone_hints: z.array(z.string()).optional(),
  style_hints: z.array(z.string()).optional(),
  structure_hints: z.array(z.string()).optional(),
  transcript: z.string().optional(),
  visual_cues: z.string().optional(),
});

const ReferenceIntentSchema = z.object({
  summary: z.string(),
});

export const WorkReferenceSchema = z
  .object({
    id: z.string(),
    asset: AssetSchema,
    analysis: ReferenceAnalysisSchema,
    intent: ReferenceIntentSchema,
    analyzed_at: z.string(),
    created_at: z.string(),
  })
  .openapi("WorkReference");

export const WorkReferencesSchema = z
  .array(WorkReferenceSchema)
  .openapi("WorkReferences");

const FormatParamsSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("text"),
    word_count: z
      .object({
        min: z.number().optional(),
        max: z.number().optional(),
      })
      .optional(),
    emoji_level: z.enum(["none", "light", "heavy"]).optional(),
  }),
  z.object({
    kind: z.literal("illustration"),
    aspect_ratio: z.string().optional(),
    image_count: z.number().optional(),
    negative_hints: z.array(z.string()).optional(),
  }),
  z.object({
    kind: z.literal("video"),
    duration_sec: z.number().optional(),
    aspect_ratio: z.string().optional(),
    pacing: z.string().optional(),
  }),
  z.object({
    kind: z.literal("audio"),
    duration_sec: z.number().optional(),
    segment_count: z.number().optional(),
  }),
]);

export const WorkProfileSchema = z
  .object({
    delivery: z.object({
      topic: z.string(),
      format: z.string().nullable(),
      modalities: z.array(z.string()),
      platform: z.string().nullable().optional(),
      category: z.string().nullable().optional(),
    }),
    expression: z.object({
      audience: z.string().nullable().optional(),
      verbal: z
        .object({
          tone: z.string().nullable().optional(),
          style: z.string().nullable().optional(),
          persona: z.string().nullable().optional(),
        })
        .optional(),
      visual: z
        .object({
          style: z.string().nullable().optional(),
          mood: z.string().nullable().optional(),
          palette: z.string().nullable().optional(),
        })
        .optional(),
    }),
    blueprint: z.object({
      summary: z.string(),
      settings: z.array(
        z.object({
          id: z.string(),
          confirmed_at: z.string(),
          kind: z.enum(["character", "world", "other"]),
          title: z.string().nullable().optional(),
          description: z.string(),
        }),
      ),
      segments: z.array(
        z.object({
          id: z.string(),
          confirmed_at: z.string(),
          role: z.string().nullable().optional(),
          title: z.string().nullable().optional(),
          description: z.string(),
        }),
      ),
    }),
    guardrails: z.array(
      z.object({
        id: z.string(),
        description: z.string(),
        scope: z.enum(["all", "verbal", "visual", "audio", "video"]),
        confirmed_at: z.string(),
      }),
    ),
    params: FormatParamsSchema,
  })
  .openapi("WorkProfile");

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
  })
  .openapi("WorkPreview");

export const WorkProductionSchema = z
  .object({
    pending_tasks: z.array(
      z.object({
        id: z.string(),
        description: z.string(),
        created_at: z.string(),
        department: z.enum(["writing", "design", "audio", "video"]).optional(),
        status: z
          .enum(["pending", "in_progress", "ready", "failed"])
          .optional(),
        direction: z.string().nullable().optional(),
        acceptance_criteria: z.string().nullable().optional(),
        feedback: z.string().nullable().optional(),
        deliverable: z
          .object({
            body: z.string(),
            title: z.string().nullable().optional(),
            notes: z.string().nullable().optional(),
          })
          .nullable()
          .optional(),
        accept_retry_count: z.number().optional(),
        failure_message: z.string().nullable().optional(),
      }),
    ),
    summary: z.string().nullable().optional(),
    preview: WorkPreviewSchema.nullable(),
  })
  .openapi("WorkProduction");

export const WorkVersionSnapshotSchema = z
  .object({
    profile: WorkProfileSchema,
    references: WorkReferencesSchema,
    production: WorkProductionSchema,
  })
  .openapi("WorkVersionSnapshot");

export const WorkVersionSchema = z
  .object({
    id: z.string(),
    workId: z.string(),
    parentVersionId: z.string().nullable(),
    conversationId: z.string().nullable(),
    summary: z.string(),
    snapshot: WorkVersionSnapshotSchema,
    createdAt: z.string(),
  })
  .openapi("WorkVersion");

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
    references: WorkReferencesSchema,
    production: WorkProductionSchema,
    headVersionId: z.string().nullable(),
    sourceWorkId: z.string().nullable(),
    sourceVersionId: z.string().nullable(),
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
    references: WorkReferencesSchema.optional(),
    production: WorkProductionSchema.optional(),
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
    headVersionId: z.string().nullable().optional(),
    profile: WorkProfileSchema,
    references: WorkReferencesSchema,
    production: WorkProductionSchema,
    threadId: z.string().nullable().optional(),
    workTitle: z.string().optional(),
    conversationTitle: z.string().optional(),
  })
  .openapi("AgentContext");

export type WorkDTO = z.infer<typeof WorkSchema>;
export type WorkConversationDTO = z.infer<typeof WorkConversationSchema>;
export type WorkGroupDTO = z.infer<typeof WorkGroupSchema>;
export type WorkVersionDTO = z.infer<typeof WorkVersionSchema>;

/** OpenAPI 组件名 Work / WorkVersion；上述 *DTO 为 API 层别名。 */

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
    images: z.array(
      z.object({
        url: z.string(),
        alt: z.string().nullable().optional(),
        prompt: z.string().nullable().optional(),
      }),
    ),
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
