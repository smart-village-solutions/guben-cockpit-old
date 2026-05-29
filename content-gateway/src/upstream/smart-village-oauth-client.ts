import { GatewayError } from "../errors.js";
import { requestJson } from "./request-json.js";
import type { SmartVillageOAuthTokenResponse } from "./smart-village-types.js";

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRY_ATTEMPTS = 1;
const DEFAULT_RETRY_BACKOFF_MS = 250;
const DEFAULT_REFRESH_THRESHOLD_MS = 60_000;

type SmartVillageOAuthClientOptions = {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  timeoutMs?: number;
  retryAttempts?: number;
  retryBackoffMs?: number;
  refreshThresholdMs?: number;
};

type CachedToken = {
  accessToken: string;
  expiresAt: number;
};

const hasUsableAccessToken = (
  cachedToken: CachedToken | null,
  refreshThresholdMs: number,
): cachedToken is CachedToken =>
  cachedToken !== null && cachedToken.expiresAt > Date.now() + refreshThresholdMs;

const isValidTokenResponse = (
  payload: SmartVillageOAuthTokenResponse,
): payload is SmartVillageOAuthTokenResponse =>
  typeof payload.access_token === "string" &&
  payload.access_token.length > 0 &&
  typeof payload.expires_in === "number" &&
  Number.isFinite(payload.expires_in) &&
  payload.expires_in > 0;

export class SmartVillageOAuthClient {
  private cachedToken: CachedToken | null = null;

  public constructor(private readonly options: SmartVillageOAuthClientOptions) {}

  public async getAccessToken(): Promise<string> {
    const refreshThresholdMs =
      this.options.refreshThresholdMs ?? DEFAULT_REFRESH_THRESHOLD_MS;

    if (hasUsableAccessToken(this.cachedToken, refreshThresholdMs)) {
      return this.cachedToken.accessToken;
    }

    const payload = await requestJson<SmartVillageOAuthTokenResponse>({
      url: this.options.tokenUrl,
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: this.options.clientId,
        client_secret: this.options.clientSecret,
      }).toString(),
      timeoutMs: this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      retryAttempts: this.options.retryAttempts ?? DEFAULT_RETRY_ATTEMPTS,
      retryBackoffMs: this.options.retryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS,
      upstream: "smartvillage",
    });

    if (!isValidTokenResponse(payload)) {
      throw new GatewayError({
        code: "INVALID_UPSTREAM_PAYLOAD",
        message: "smartvillage oauth response did not include a usable access token",
        statusCode: 502,
        upstream: "smartvillage",
        retryable: false,
      });
    }

    this.cachedToken = {
      accessToken: payload.access_token,
      expiresAt: Date.now() + payload.expires_in * 1000,
    };

    return this.cachedToken.accessToken;
  }
}
