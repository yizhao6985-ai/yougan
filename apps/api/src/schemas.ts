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

const ContentFormMediaParamsSchema = z.object({
  text: z
    .object({
      word_count: z
        .object({
          min: z.number().optional(),
          max: z.number().optional(),
        })
        .optional(),
      emoji_level: z.enum(["none", "light", "heavy"]).optional(),
    })
    .optional(),
  image: z
    .object({
      aspect_ratio: z.string().optional(),
    })
    .optional(),
  video: z
    .object({
      duration_sec: z.number().optional(),
      aspect_ratio: z.string().optional(),
      pacing: z.string().optional(),
    })
    .optional(),
  audio: z
    .object({
      duration_sec: z.number().optional(),
    })
    .optional(),
});

export const ProfileSpecItemSchema = z.object({
  id: z.string(),
  spec: z.string(),
});

export const PreviewImageSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  alt: z.string().nullable().optional(),
  prompt: z.string().nullable().optional(),
  transient: z.boolean().optional(),
  taskId: z.string().nullable().optional(),
});

export const ScriptSegmentSchema = z
  .object({
    id: z.string(),
    label: z.string().nullable().optional(),
    body: z.string(),
    durationSec: z.number().nullable().optional(),
  })
  .openapi("ScriptSegment");

export const PreviewContentSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("note"),
    body: z.string(),
    images: z.array(PreviewImageSchema),
  }),
  z.object({
    kind: z.literal("article"),
    body: z.string(),
    images: z.array(PreviewImageSchema).optional(),
  }),
  z.object({
    kind: z.literal("blog"),
    body: z.string(),
    images: z.array(PreviewImageSchema).optional(),
  }),
  z.object({
    kind: z.literal("short_post"),
    body: z.string(),
    images: z.array(PreviewImageSchema).optional(),
  }),
  z.object({
    kind: z.literal("novel"),
    body: z.string(),
    images: z.array(PreviewImageSchema).optional(),
  }),
  z.object({
    kind: z.literal("video_script"),
    segments: z.array(ScriptSegmentSchema).min(1),
    body: z.string().optional(),
  }),
  z.object({
    kind: z.literal("short_video"),
    segments: z.array(ScriptSegmentSchema).min(1),
    body: z.string().optional(),
  }),
  z.object({
    kind: z.literal("podcast"),
    segments: z.array(ScriptSegmentSchema).min(1),
    body: z.string().optional(),
  }),
  z.object({
    kind: z.literal("music"),
    segments: z.array(ScriptSegmentSchema).min(1),
    body: z.string().optional(),
  }),
  z.object({
    kind: z.literal("illustration"),
    images: z.array(PreviewImageSchema).min(1),
    caption: z.string().nullable().optional(),
  }),
]).openapi("PreviewContent");

export const WorkProfileSchema = z
  .object({
    direction: z.object({
      summary: z.string(),
      format: z.string().nullable(),
      audience: z.string().nullable().optional(),
    }),
    style: z
      .object({
        verbal: z.string().nullable().optional(),
        visual: z.string().nullable().optional(),
      })
      .optional(),
    setting: z.array(ProfileSpecItemSchema).optional(),
    requirements: z.array(ProfileSpecItemSchema).optional(),
    bounds: z.array(ProfileSpecItemSchema),
  })
  .openapi("WorkProfile");

export const WorkPreviewSchema = z
  .object({
    title: z.string().nullable().optional(),
    hook: z.string().nullable().optional(),
    hashtags: z.array(z.string()).optional(),
    notes: z.string().nullable().optional(),
    content: PreviewContentSchema.nullable().optional(),
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
            images: z
              .array(
                z.object({
                  url: z.string().url(),
                  alt: z.string().nullable().optional(),
                  prompt: z.string().nullable().optional(),
                  transient: z.boolean().optional(),
                }),
              )
              .optional(),
          })
          .nullable()
          .optional(),
        accept_retry_count: z.number().optional(),
        failure_message: z.string().nullable().optional(),
      }),
    ),
    summary: z.string().nullable().optional(),
  })
  .openapi("WorkProduction");

export const RevisionAnchorSchema = z
  .object({
    blockId: z.string(),
    quote: z.string(),
    startOffset: z.number().nullable().optional(),
    endOffset: z.number().nullable().optional(),
  })
  .openapi("RevisionAnchor");

export const RevisionIntentSchema = z
  .object({
    id: z.string(),
    anchor: RevisionAnchorSchema.nullable().optional(),
    instruction: z.string(),
    source: z.enum(["selection", "chat", "manual"]),
    created_at: z.string(),
    status: z.enum(["open", "withdrawn"]).optional(),
  })
  .openapi("RevisionIntent");

export const WorkRevisionSchema = z
  .object({
    baselineVersionId: z.string().nullable().optional(),
    status: z.enum(["collecting", "ready", "applying"]),
    items: z.array(RevisionIntentSchema),
    updatedAt: z.string().nullable().optional(),
  })
  .openapi("WorkRevision");

export const WorkVersionSnapshotSchema = z
  .object({
    profile: WorkProfileSchema,
    references: WorkReferencesSchema,
    preview: WorkPreviewSchema.nullable(),
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
    preview: WorkPreviewSchema.nullable(),
    revision: WorkRevisionSchema,
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
    email: z.string().email().nullable(),
    phone: z.string().nullable(),
    hasPassword: z.boolean(),
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
    preview: WorkPreviewSchema.nullable().optional(),
    revision: WorkRevisionSchema.optional(),
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
    preview: WorkPreviewSchema.nullable(),
    revision: WorkRevisionSchema,
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
  email: z.string().email().nullable(),
  phone: z.string().nullable().optional(),
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
    preview: WorkPreviewSchema,
    coverUrl: z.string().url().nullable(),
    coverImageId: z.string().nullable(),
    compositionLabel: z.string().nullable(),
    consumptionHint: z.string().nullable(),
    blockComposition: z
      .object({
        blockTypes: z.array(z.enum(["text", "image", "audio", "video"])),
        textBlockCount: z.number(),
        imageCount: z.number(),
        audioCount: z.number(),
        videoCount: z.number(),
        textLength: z.number(),
        totalAudioDurationSec: z.number().nullable(),
        totalVideoDurationSec: z.number().nullable(),
      })
      .optional(),
    contentFormat: z.string().nullable(),
    topicCategory: z.string().nullable(),
    contentTopic: z.string().nullable(),
    contentType: z.string().nullable(),
    mediaTypes: z.array(z.string()),
    hashtags: z.array(z.string()),
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
    usagePercent: z.number(),
    usageExceeded: z.boolean(),
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
    planId: z.enum(["pro", "pro_plus"]),
    billingCycle: z.enum(["monthly", "yearly"]),
  })
  .openapi("CheckoutSubscription");
