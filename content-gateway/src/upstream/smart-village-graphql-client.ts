import { GatewayError } from "../errors.js";
import { requestJson } from "./request-json.js";
import type { SmartVillageGraphQLResponse } from "./smart-village-types.js";

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_RETRY_ATTEMPTS = 1;
const DEFAULT_RETRY_BACKOFF_MS = 250;

type SmartVillageGraphQLClientOptions = {
  graphqlUrl: string;
  oauthClient: {
    getAccessToken(): Promise<string>;
  };
  timeoutMs?: number;
  retryAttempts?: number;
  retryBackoffMs?: number;
};

export class SmartVillageGraphQLClient {
  public constructor(private readonly options: SmartVillageGraphQLClientOptions) {}

  public async request<T>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    const accessToken = await this.options.oauthClient.getAccessToken();
    const response = await requestJson<SmartVillageGraphQLResponse<T>>({
      url: this.options.graphqlUrl,
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
      timeoutMs: this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      retryAttempts: this.options.retryAttempts ?? DEFAULT_RETRY_ATTEMPTS,
      retryBackoffMs: this.options.retryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS,
      upstream: "smartvillage",
    });

    if (response.errors && response.errors.length > 0) {
      const firstMessage = response.errors[0]?.message?.trim();
      throw new GatewayError({
        code: "UPSTREAM_UNAVAILABLE",
        message:
          firstMessage && firstMessage.length > 0
            ? `smartvillage graphql error: ${firstMessage}`
            : "smartvillage graphql request failed",
        statusCode: 503,
        upstream: "smartvillage",
        retryable: true,
      });
    }

    if (response.data === undefined || response.data === null) {
      throw new GatewayError({
        code: "INVALID_UPSTREAM_PAYLOAD",
        message: "smartvillage graphql response did not include data",
        statusCode: 502,
        upstream: "smartvillage",
        retryable: false,
      });
    }

    return response.data;
  }
}
