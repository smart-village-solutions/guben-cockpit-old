import { z } from "zod";

const localHttpHosts = new Set(["localhost", "127.0.0.1", "::1"]);
const internalHttpHosts = new Set(["masterportal"]);
const localDevelopmentPort = "3000";

const createHttpUrl = (hostname: string, port?: string) => {
  const url = new URL("https://placeholder.invalid");
  url.protocol = "http:";
  url.hostname = hostname;

  if (port) {
    url.port = port;
  }

  return url.toString();
};

const localPublicBaseUrlDefault = createHttpUrl("localhost", localDevelopmentPort);
const masterportalUrlDefault = createHttpUrl("masterportal");
const smartVillageFields = [
  "SV_GRAPHQL_URL",
  "SV_OAUTH_TOKEN_URL",
  "SV_CLIENT_ID",
  "SV_CLIENT_SECRET",
] as const;

const isHttpUrlAllowed = (value: string, allowedHttpHosts: Set<string>) => {
  try {
    const url = new URL(value);

    if (url.protocol === "https:") {
      return true;
    }

    return url.protocol === "http:" && allowedHttpHosts.has(url.hostname);
  } catch {
    return false;
  }
};

const createSecureUrlSchema = (
  message: string,
  allowedHttpHosts: Set<string>,
) =>
  z.string().url().refine(
    (value) => isHttpUrlAllowed(value, allowedHttpHosts),
    message,
  );

const baseConfigSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5100),
  LOG_LEVEL: z.string().default("info"),
  PUBLIC_BASE_URL: createSecureUrlSchema(
    "PUBLIC_BASE_URL must use https unless it targets a local development host.",
    localHttpHosts,
  ).default(localPublicBaseUrlDefault),
  MASTERPORTAL_URL: createSecureUrlSchema(
    "MASTERPORTAL_URL must use https unless it targets an explicitly allowed internal host.",
    new Set([...localHttpHosts, ...internalHttpHosts]),
  ).default(masterportalUrlDefault),
  CONTENT_SOURCE_MODE: z.enum(["mock", "postgrest"]),
  DEFAULT_LANGUAGE: z.string().min(2).default("de"),
  FALLBACK_LANGUAGE: z.string().min(2).default("de"),
  SV_GRAPHQL_URL: createSecureUrlSchema(
    "SV_GRAPHQL_URL must use https unless it targets a local development host.",
    localHttpHosts,
  ).optional(),
  SV_OAUTH_TOKEN_URL: createSecureUrlSchema(
    "SV_OAUTH_TOKEN_URL must use https unless it targets a local development host.",
    localHttpHosts,
  ).optional(),
  SV_CLIENT_ID: z.string().min(1).optional(),
  SV_CLIENT_SECRET: z.string().min(1).optional(),
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

const ensureRequiredSmartVillageConfig = (config: Config): Config => {
  if (config.CONTENT_SOURCE_MODE !== "postgrest") {
    return config;
  }

  const missingSmartVillageFields = smartVillageFields.filter((field) => {
    const value = config[field];
    return typeof value !== "string" || value.trim().length === 0;
  });

  if (missingSmartVillageFields.length > 0) {
    throw new Error(
      `Smart Village upstream configuration requires all of: ${smartVillageFields.join(", ")}`,
    );
  }

  return config;
};

export const loadConfig = (env: NodeJS.ProcessEnv = process.env): Config => {
  const normalizedEnv = {
    ...env,
    CONTENT_SOURCE_MODE: env.CONTENT_SOURCE_MODE ?? "mock",
  };

  const parsedConfig =
    normalizedEnv.CONTENT_SOURCE_MODE === "postgrest"
      ? postgrestConfigSchema.parse(normalizedEnv)
      : mockConfigSchema.parse(normalizedEnv);

  return ensureRequiredSmartVillageConfig(parsedConfig);
};
