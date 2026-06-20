import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import {
  AgentContextSchema,
  AuthTokenSchema,
  BillingOrderSchema,
  CheckoutSubscriptionSchema,
  ErrorSchema,
  SubscriptionPlanSchema,
  SubscriptionSummarySchema,
  SyncWorkStateSchema,
  UploadResponseSchema,
  UserSchema,
  UpdateProfileSchema,
  WorkGroupSchema,
  WorkVersionSchema,
  WorkVersionSnapshotSchema,
  WorkSchema,
} from "../src/schemas.js";

export const registry = new OpenAPIRegistry();

registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

const security = [{ bearerAuth: [] }];

registry.registerPath({
  method: "post",
  path: "/api/auth/register",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            login: z.string().min(1),
            password: z.string().min(6),
            name: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: "Registered",
      content: { "application/json": { schema: AuthTokenSchema } },
    },
    409: {
      description: "Account exists",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/login",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            login: z.string().min(1),
            password: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Logged in",
      content: { "application/json": { schema: AuthTokenSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/sms/send",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({ phone: z.string().min(1) }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "SMS code sent",
      content: {
        "application/json": {
          schema: z.object({
            ok: z.literal(true),
            cooldownSeconds: z.number(),
            devCode: z.string().optional(),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/sms/login",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            phone: z.string().min(1),
            code: z.string().length(6),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Logged in with SMS",
      content: { "application/json": { schema: AuthTokenSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/auth/me",
  tags: ["Auth"],
  security,
  responses: {
    200: {
      description: "Current user",
      content: {
        "application/json": { schema: z.object({ user: UserSchema }) },
      },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/auth/me",
  tags: ["Auth"],
  security,
  request: {
    body: {
      content: { "application/json": { schema: UpdateProfileSchema } },
    },
  },
  responses: {
    200: {
      description: "Updated profile",
      content: {
        "application/json": { schema: z.object({ user: UserSchema }) },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/forgot-password",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({ email: z.string().email() }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Reset email requested",
      content: {
        "application/json": { schema: z.object({ ok: z.literal(true) }) },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/reset-password",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            token: z.string().min(1),
            password: z.string().min(6),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Password reset",
      content: {
        "application/json": { schema: z.object({ ok: z.literal(true) }) },
      },
    },
    400: {
      description: "Invalid token or password",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/logout",
  tags: ["Auth"],
  security,
  responses: {
    204: { description: "Logged out" },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/work-groups",
  tags: ["WorkGroups"],
  security,
  responses: {
    200: {
      description: "List work groups",
      content: {
        "application/json": {
          schema: z.object({ groups: z.array(WorkGroupSchema) }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/work-groups",
  tags: ["WorkGroups"],
  security,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({ title: z.string().optional() }),
        },
      },
    },
  },
  responses: {
    201: {
      description: "Created",
      content: {
        "application/json": { schema: z.object({ group: WorkGroupSchema }) },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/work-groups/{groupId}",
  tags: ["WorkGroups"],
  security,
  request: { params: z.object({ groupId: z.string() }) },
  responses: {
    200: {
      description: "Group detail",
      content: {
        "application/json": { schema: z.object({ group: WorkGroupSchema }) },
      },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/work-groups/{groupId}",
  tags: ["WorkGroups"],
  security,
  request: {
    params: z.object({ groupId: z.string() }),
    body: {
      content: {
        "application/json": {
          schema: z.object({ title: z.string().optional() }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Updated",
      content: {
        "application/json": { schema: z.object({ group: WorkGroupSchema }) },
      },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/work-groups/{groupId}",
  tags: ["WorkGroups"],
  security,
  request: { params: z.object({ groupId: z.string() }) },
  responses: { 204: { description: "Deleted" } },
});

registry.registerPath({
  method: "get",
  path: "/api/works",
  tags: ["Works"],
  security,
  responses: {
    200: {
      description: "List works",
      content: {
        "application/json": { schema: z.object({ works: z.array(WorkSchema) }) },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/works",
  tags: ["Works"],
  security,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            title: z.string().optional(),
            groupId: z.string().nullable().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: "Created",
      content: { "application/json": { schema: z.object({ work: WorkSchema }) } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/works/{workId}",
  tags: ["Works"],
  security,
  request: { params: z.object({ workId: z.string() }) },
  responses: {
    200: {
      description: "Work detail",
      content: { "application/json": { schema: z.object({ work: WorkSchema }) } },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/works/{workId}",
  tags: ["Works"],
  security,
  request: {
    params: z.object({ workId: z.string() }),
    body: { content: { "application/json": { schema: SyncWorkStateSchema } } },
  },
  responses: {
    200: {
      description: "Updated",
      content: { "application/json": { schema: z.object({ work: WorkSchema }) } },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/works/{workId}",
  tags: ["Works"],
  security,
  request: { params: z.object({ workId: z.string() }) },
  responses: { 204: { description: "Deleted" } },
});

registry.registerPath({
  method: "get",
  path: "/api/works/{workId}/agent-context",
  tags: ["Works"],
  security,
  request: {
    params: z.object({ workId: z.string() }),
    query: z.object({ conversationId: z.string().optional() }),
  },
  responses: {
    200: {
      description: "Agent context for a work",
      content: {
        "application/json": { schema: z.object({ context: AgentContextSchema }) },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/works/{workId}/versions",
  tags: ["Works"],
  security,
  request: { params: z.object({ workId: z.string() }) },
  responses: {
    200: {
      description: "Version history for a work",
      content: {
        "application/json": {
          schema: z.object({ versions: z.array(WorkVersionSchema) }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/works/{workId}/restore/{versionId}",
  tags: ["Works"],
  security,
  request: {
    params: z.object({ workId: z.string(), versionId: z.string() }),
  },
  responses: {
    200: {
      description: "Restore work to a version snapshot",
      content: {
        "application/json": {
          schema: z.object({
            version: WorkVersionSchema,
            work: WorkSchema,
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/works/{workId}/duplicate",
  tags: ["Works"],
  security,
  request: {
    params: z.object({ workId: z.string() }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            title: z.string().optional(),
            groupId: z.string().nullable().optional(),
            versionId: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: "Duplicate work from current or historical version",
      content: {
        "application/json": { schema: z.object({ work: WorkSchema }) },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/upload",
  tags: ["Upload"],
  security,
  responses: {
    200: {
      description: "Uploaded",
      content: { "application/json": { schema: UploadResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/subscription/plans",
  tags: ["Subscription"],
  responses: {
    200: {
      description: "Available subscription plans",
      content: {
        "application/json": {
          schema: z.object({ plans: z.array(SubscriptionPlanSchema) }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/subscription",
  tags: ["Subscription"],
  security,
  responses: {
    200: {
      description: "Current membership / subscription",
      content: {
        "application/json": {
          schema: z.object({ subscription: SubscriptionSummarySchema }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/subscription/cancel",
  tags: ["Subscription"],
  security,
  responses: {
    200: {
      description: "Subscription set to cancel at period end",
      content: {
        "application/json": {
          schema: z.object({ subscription: SubscriptionSummarySchema }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/subscription/resume",
  tags: ["Subscription"],
  security,
  responses: {
    200: {
      description: "Subscription renewal resumed",
      content: {
        "application/json": {
          schema: z.object({ subscription: SubscriptionSummarySchema }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/billing/orders",
  tags: ["Billing"],
  security,
  responses: {
    200: {
      description: "Billing orders",
      content: {
        "application/json": {
          schema: z.object({ orders: z.array(BillingOrderSchema) }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/billing/checkout",
  tags: ["Billing"],
  security,
  request: {
    body: {
      content: { "application/json": { schema: CheckoutSubscriptionSchema } },
    },
  },
  responses: {
    200: {
      description: "Checkout completed",
      content: {
        "application/json": {
          schema: z.object({
            orderId: z.string(),
            subscription: SubscriptionSummarySchema,
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/billing/orders/{orderId}/refund",
  tags: ["Billing"],
  security,
  request: {
    params: z.object({ orderId: z.string() }),
  },
  responses: {
    200: {
      description: "Order refunded and membership adjusted",
      content: {
        "application/json": {
          schema: z.object({
            order: z.unknown(),
            subscription: SubscriptionSummarySchema,
          }),
        },
      },
    },
  },
});

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: "3.0.3",
    info: {
      title: "Yougan API",
      version: "0.1.0",
      description:
        "有感 Yougan 中间层：账号鉴权、作品管理、OSS 上传、Agent 流转发。",
    },
    servers: [{ url: "http://localhost:4000", description: "Local" }],
  });
}
