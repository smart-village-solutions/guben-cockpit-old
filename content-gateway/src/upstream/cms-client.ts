import { GatewayError } from "../errors.js";
import { requestJson } from "./request-json.js";

type GraphQlResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

export class CmsClient {
  private readonly graphqlUrl: string;
  private readonly apiKey: string;
  private readonly apiKeyHeader: string;
  private readonly timeoutMs: number;
  private readonly retryAttempts: number;
  private readonly retryBackoffMs: number;

  public constructor(config: {
    CMS_GRAPHQL_URL: string;
    CMS_API_KEY: string;
    CMS_API_KEY_HEADER?: string;
    CMS_TIMEOUT_MS?: number;
    CMS_RETRY_ATTEMPTS?: number;
    CMS_RETRY_BACKOFF_MS?: number;
  }) {
    this.graphqlUrl = config.CMS_GRAPHQL_URL;
    this.apiKey = config.CMS_API_KEY;
    this.apiKeyHeader = config.CMS_API_KEY_HEADER ?? "x-api-key";
    this.timeoutMs = config.CMS_TIMEOUT_MS ?? 2500;
    this.retryAttempts = config.CMS_RETRY_ATTEMPTS ?? 2;
    this.retryBackoffMs = config.CMS_RETRY_BACKOFF_MS ?? 200;
  }

  public async execute<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const response = await requestJson<GraphQlResponse<T>>({
      url: this.graphqlUrl,
      method: "POST",
      headers: {
        "content-type": "application/json",
        [this.apiKeyHeader]: this.apiKey,
      },
      body: JSON.stringify({ query, variables }),
      timeoutMs: this.timeoutMs,
      retryAttempts: this.retryAttempts,
      retryBackoffMs: this.retryBackoffMs,
      upstream: "cms",
    });

    if (!response.data || response.errors?.length) {
      throw new GatewayError({
        code: "INVALID_UPSTREAM_PAYLOAD",
        message: "cms returned an invalid GraphQL payload",
        statusCode: 502,
        upstream: "cms",
        retryable: false,
      });
    }

    return response.data;
  }
}
