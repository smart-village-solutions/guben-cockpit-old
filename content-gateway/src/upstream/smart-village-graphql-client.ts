import { GatewayError } from "../errors.js";
import { requestJson } from "./request-json.js";
import type { SmartVillageGraphQLResponse } from "./smart-village-types.js";
import { ResilientReadCache, type ResilientReadCacheOptions } from "./resilient-read-cache.js";

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
  readCache?: ResilientReadCache<unknown>;
  readCacheOptions?: ResilientReadCacheOptions;
};

export type CachedGraphQLReadOptions<T> = {
  contractId: string;
  query: string;
  variables?: Record<string, unknown>;
  validate: (response: T) => void;
};

export type SmartVillageGraphQLReader = {
  request<T>(query: string, variables?: Record<string, unknown>): Promise<T>;
  requestCached?<T>(options: CachedGraphQLReadOptions<T>): Promise<T>;
};

export const requestCached = <T>(
  client: SmartVillageGraphQLReader,
  options: CachedGraphQLReadOptions<T>,
) => client.requestCached?.(options) ?? (options.variables === undefined
  ? client.request<T>(options.query)
  : client.request<T>(options.query, options.variables)).then((response) => {
  options.validate(response);
  return response;
});

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map((item) => item === undefined ? null : canonicalize(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  }
  return value;
};

export const createCachedReadKey = (
  contractId: string,
  query: string,
  variables?: Record<string, unknown>,
) => JSON.stringify([contractId, query, canonicalize(variables ?? {})]);

export class SmartVillageGraphQLClient {
  private readonly readCache: ResilientReadCache<unknown>;

  public constructor(private readonly options: SmartVillageGraphQLClientOptions) {
    this.readCache = options.readCache ?? new ResilientReadCache(options.readCacheOptions);
  }

  public requestCached<T>(options: CachedGraphQLReadOptions<T>): Promise<T> {
    const key = createCachedReadKey(options.contractId, options.query, options.variables);
    return this.readCache.getOrLoad(key, async () => {
      const response = await this.request<T>(options.query, options.variables);
      options.validate(response);
      return response;
    });
  }

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
