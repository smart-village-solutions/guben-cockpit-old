import { contentGatewayBaseUrl } from "./source";
import { gatewayErrorSchema, type GatewayError } from "@shared/public-content/contracts";

export class GatewayRequestError extends Error {
  public readonly details: GatewayError["error"];
  public readonly status: number;

  public constructor(details: GatewayError["error"], status: number) {
    super(details.message);
    this.name = "GatewayRequestError";
    this.details = details;
    this.status = status;
  }
}

const buildUrl = (path: string, searchParams?: Record<string, string | number | undefined>) => {
  const url = new URL(path, contentGatewayBaseUrl);
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
};

export const fetchGatewayJson = async <TOutput>(
  path: string,
  schema: { parse(input: unknown): TOutput },
  searchParams?: Record<string, string | number | undefined>,
) => {
  const response = await fetch(buildUrl(path, searchParams), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const parsedError = gatewayErrorSchema.safeParse(await response.json().catch(() => undefined));
    if (parsedError.success) {
      throw new GatewayRequestError(parsedError.data.error, response.status);
    }

    throw new GatewayRequestError(
      {
        code: "INTERNAL_ERROR",
        message: "Gateway request failed",
        upstream: "gateway",
        retryable: false,
        requestId: "unknown",
      },
      response.status,
    );
  }

  const payload = await response.json();
  return schema.parse(payload);
};

export const isGatewayRequestError = (value: unknown): value is GatewayRequestError =>
  value instanceof GatewayRequestError;
