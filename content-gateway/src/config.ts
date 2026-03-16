import { z } from "zod";

const baseConfigSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5100),
  LOG_LEVEL: z.string().default("info"),
  PUBLIC_BASE_URL: z.string().url().default("http://localhost:3000"),
  MASTERPORTAL_URL: z.string().url().or(z.string().startsWith("http://")).default("http://masterportal"),
  CONTENT_SOURCE_MODE: z.enum(["mock", "postgrest"]),
  DEFAULT_LANGUAGE: z.string().min(2).default("de"),
  FALLBACK_LANGUAGE: z.string().min(2).default("de"),
});

const mockConfigSchema = baseConfigSchema.extend({
  CONTENT_SOURCE_MODE: z.literal("mock"),
});

const postgrestConfigSchema = baseConfigSchema.extend({
  CONTENT_SOURCE_MODE: z.literal("postgrest"),
  POSTGREST_URL: z.string().url(),
  POSTGREST_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  POSTGREST_SCHEMA: z.string().min(1).default("public_content"),
});

export type Config = z.infer<typeof mockConfigSchema> | z.infer<typeof postgrestConfigSchema>;
export type PostgrestConfig = z.infer<typeof postgrestConfigSchema>;

export const loadConfig = (env: NodeJS.ProcessEnv = process.env): Config => {
  const normalizedEnv = {
    ...env,
    CONTENT_SOURCE_MODE: env.CONTENT_SOURCE_MODE ?? "mock",
  };

  return normalizedEnv.CONTENT_SOURCE_MODE === "postgrest"
    ? postgrestConfigSchema.parse(normalizedEnv)
    : mockConfigSchema.parse(normalizedEnv);
};
