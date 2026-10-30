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

async function requestOnce<T>(options: RequestJsonOptions): Promise<T> {
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
  } finally {
    clearTimeout(timeout);
  }
}

async function requestWithRetry<T>(options: RequestJsonOptions, attempt: number, lastError?: unknown): Promise<T> {
  if (!(attempt <= options.retryAttempts)) {
    throw lastError instanceof Error ? lastError : new Error("Unknown upstream error");
  }

  let retryError: unknown;
  try {
    return await requestOnce<T>(options);
  } catch (error) {
    const gatewayError = toGatewayError(error, options.upstream);
    if (!gatewayError.retryable || attempt === options.retryAttempts) {
      throw gatewayError;
    }
    retryError = error;
  }

  // Retries are deliberately sequential; the previous attempt's timer is cleared
  // before its backoff starts, and each new attempt owns a fresh abort signal.
  await delay(options.retryBackoffMs * (attempt + 1));
  return requestWithRetry<T>(options, attempt + 1, retryError);
}

export function requestJson<T>(options: RequestJsonOptions): Promise<T> {
  return requestWithRetry<T>(options, 0);
}
