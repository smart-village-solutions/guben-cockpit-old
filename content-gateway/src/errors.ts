export type GatewayErrorCode =
  | "UPSTREAM_TIMEOUT"
  | "UPSTREAM_UNAVAILABLE"
  | "INVALID_UPSTREAM_PAYLOAD"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

export type UpstreamName = "cms" | "postgrest" | "gateway";

export class GatewayError extends Error {
  public readonly code: GatewayErrorCode;
  public readonly statusCode: number;
  public readonly upstream: UpstreamName;
  public readonly retryable: boolean;

  public constructor(options: {
    code: GatewayErrorCode;
    message: string;
    statusCode: number;
    upstream: UpstreamName;
    retryable: boolean;
  }) {
    super(options.message);
    this.name = "GatewayError";
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.upstream = options.upstream;
    this.retryable = options.retryable;
  }
}

export const isGatewayError = (value: unknown): value is GatewayError =>
  value instanceof GatewayError;
