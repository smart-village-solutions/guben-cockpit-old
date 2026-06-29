export type BookingApiErrorCode =
  | "BOOKING_API_CONFIG_ERROR"
  | "BOOKING_API_TRANSPORT_ERROR"
  | "BOOKING_API_HTTP_ERROR"
  | "BOOKING_API_INVALID_PAYLOAD";

export class BookingApiError extends Error {
  public readonly code: BookingApiErrorCode;
  public readonly retryable: boolean;
  public readonly status?: number;
  public readonly cause?: unknown;

  public constructor(options: {
    code: BookingApiErrorCode;
    message: string;
    retryable: boolean;
    status?: number;
    cause?: unknown;
  }) {
    super(options.message);
    this.name = "BookingApiError";
    this.code = options.code;
    this.retryable = options.retryable;
    this.status = options.status;
    this.cause = options.cause;
  }
}

export const isBookingApiError = (value: unknown): value is BookingApiError =>
  value instanceof BookingApiError;
