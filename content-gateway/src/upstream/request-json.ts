import { GatewayError, type UpstreamName } from "../errors.js";

type RequestJsonUpstream = Extract<UpstreamName, "postgrest" | "smartvillage">;

type RequestJsonOptions = {
  url: string;
  method?: string;
  headers?: HeadersInit;
  body?: string;
  timeoutMs: number;
  retryAttempts: number;
  retryBackoffMs: number;
  upstream: RequestJsonUpstream;
};

const delay = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const toGatewayError = (error: unknown, upstream: RequestJsonUpstream): GatewayError => {
  if (error instanceof GatewayError) return error;
  if (error instanceof DOMException && error.name === "AbortError") {
    return new GatewayError({
      code: "UPSTREAM_TIMEOUT",
      message: `${upstream} request timed out`,
      statusCode: 503,
      upstream,
      retryable: true,
    });
  }
  return new GatewayError({
    code: "UPSTREAM_UNAVAILABLE",
    message: `${upstream} request failed`,
    statusCode: 503,
    upstream,
    retryable: true,
  });
};

export async function requestJson<T>(options: RequestJsonOptions): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= options.retryAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

    try {
      const response = await fetch(options.url, {
        method: options.method ?? "GET",
        headers: options.headers,
        body: options.body,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new GatewayError({
          code: "UPSTREAM_UNAVAILABLE",
          message: `${options.upstream} request failed with status ${response.status}`,
          statusCode: 503,
          upstream: options.upstream,
          retryable: response.status >= 500,
        });
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      const gatewayError = toGatewayError(error, options.upstream);
      if (!gatewayError.retryable || attempt === options.retryAttempts) {
        throw gatewayError;
      }
    } finally {
      clearTimeout(timeout);
    }

    await delay(options.retryBackoffMs * (attempt + 1));
  }

  throw lastError instanceof Error ? lastError : new Error("Unknown upstream error");
}
