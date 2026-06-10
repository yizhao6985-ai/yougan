import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
loadEnv({ path: resolve(root, ".env") });

function emptyToUndefined(value: unknown) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const optionalString = z.preprocess(emptyToUndefined, z.string().optional());

const ApiEnvSchema = z
  .object({
    PORT: z.coerce.number().int().positive().default(4000),
    JWT_SECRET: z.preprocess(
      (value) => (typeof value === "string" ? value.trim() : value),
      z.string().min(1),
    ),
    AGENT_URL: z.string().url().default("http://localhost:2024"),
    PUBLIC_BASE_URL: z.string().url().default("http://localhost:4000"),
    STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
    STORAGE_LOCAL_DIR: z.string().default("./storage"),
    OSS_ENDPOINT: optionalString,
    OSS_REGION: z.string().default("auto"),
    OSS_BUCKET: optionalString,
    OSS_ACCESS_KEY_ID: optionalString,
    OSS_SECRET_ACCESS_KEY: optionalString,
    REDIS_URL: optionalString,
    WEB_APP_URL: z.string().url().default("http://localhost:3000"),
    SMTP_HOST: optionalString,
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_USER: optionalString,
    SMTP_PASS: optionalString,
    MAIL_FROM: optionalString,
  })
  .superRefine((env, ctx) => {
    if (env.STORAGE_DRIVER !== "s3") return;

    const required: Array<keyof typeof env> = [
      "OSS_ENDPOINT",
      "OSS_BUCKET",
      "OSS_ACCESS_KEY_ID",
      "OSS_SECRET_ACCESS_KEY",
    ];

    for (const key of required) {
      if (!env[key]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${key} is required when STORAGE_DRIVER=s3`,
          path: [key],
        });
      }
    }
  })
  .transform((env) => ({
    port: env.PORT,
    jwtSecret: env.JWT_SECRET,
    agentUrl: env.AGENT_URL,
    publicBaseUrl: env.PUBLIC_BASE_URL,
    webAppUrl: env.WEB_APP_URL,
    mail: {
      from: env.MAIL_FROM ?? "Yougan <noreply@yougan.local>",
      smtpConfigured: Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS),
      smtp: {
        host: env.SMTP_HOST ?? null,
        port: env.SMTP_PORT,
        user: env.SMTP_USER ?? null,
        pass: env.SMTP_PASS ?? null,
      },
    },
    isProduction: (process.env.NODE_ENV ?? "development") === "production",
    redis: {
      url: env.REDIS_URL ?? null,
    },
    cache: {
      publicationFeedTtl: 60,
      publicationSlugTtl: 300,
      userTtl: 300,
      backfillLockTtl: 300,
    },
    storage: {
      driver: env.STORAGE_DRIVER,
      localDir: env.STORAGE_LOCAL_DIR,
      s3: {
        endpoint: env.OSS_ENDPOINT,
        region: env.OSS_REGION,
        bucket: env.OSS_BUCKET,
        accessKeyId: env.OSS_ACCESS_KEY_ID,
        secretAccessKey: env.OSS_SECRET_ACCESS_KEY,
      },
    },
  }));

function parseEnv<S extends z.ZodTypeAny>(
  schema: S,
  label: string,
): z.infer<S> {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    console.error(
      `Invalid ${label} environment variables:`,
      result.error.flatten().fieldErrors,
    );
    throw new Error(`Invalid ${label} environment variables`);
  }
  return result.data;
}

export type ApiEnv = z.infer<typeof ApiEnvSchema>;

export const env = parseEnv(ApiEnvSchema, "api");
