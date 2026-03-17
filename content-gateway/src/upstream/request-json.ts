import { GatewayError } from "../errors.js";

type RequestJsonOptions = {
  url: string;
  method?: string;
  headers?: HeadersInit;
  body?: string;
  timeoutMs: number;
  retryAttempts: number;
  retryBackoffMs: number;
  upstream: "postgrest";
};

const delay = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

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
      if (error instanceof GatewayError) {
        if (!error.retryable || attempt === options.retryAttempts) {
          throw error;
        }
      } else if (error instanceof DOMException && error.name === "AbortError") {
        if (attempt === options.retryAttempts) {
          throw new GatewayError({
            code: "UPSTREAM_TIMEOUT",
            message: `${options.upstream} request timed out`,
            statusCode: 503,
            upstream: options.upstream,
            retryable: true,
          });
        }
      } else if (attempt === options.retryAttempts) {
        throw new GatewayError({
          code: "UPSTREAM_UNAVAILABLE",
          message: `${options.upstream} request failed`,
          statusCode: 503,
          upstream: options.upstream,
          retryable: true,
        });
      }
    } finally {
      clearTimeout(timeout);
    }

    await delay(options.retryBackoffMs * (attempt + 1));
  }

  throw lastError instanceof Error ? lastError : new Error("Unknown upstream error");
}
