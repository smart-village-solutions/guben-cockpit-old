import { BookingApiError } from "./errors";
import { getBookingApiBaseUrl } from "./config";
import { occupancySchema, publicBookablesSchema } from "./schemas";
import { mapBookableToBooking, mapOccupancyToAvailability } from "./mappers";

const buildBookingApiUrl = (path: string, searchParams?: Record<string, string | number | undefined>) => {
  const url = new URL(path, `${getBookingApiBaseUrl()}/`);

  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
};

const fetchBookingJson = async <TOutput>(
  path: string,
  schema: { parse(input: unknown): TOutput },
  searchParams?: Record<string, string | number | undefined>,
): Promise<TOutput> => {
  const response = await fetch(buildBookingApiUrl(path, searchParams), {
    headers: {
      Accept: "application/json",
    },
  }).catch((cause) => {
    throw new BookingApiError({
      code: "BOOKING_API_TRANSPORT_ERROR",
      message: "Booking API is unreachable.",
      retryable: true,
      cause,
    });
  });

  if (!response.ok) {
    throw new BookingApiError({
      code: "BOOKING_API_HTTP_ERROR",
      message: `Booking API request failed with status ${response.status}.`,
      retryable: response.status >= 500 || response.status === 429,
      status: response.status,
    });
  }

  const payload = await response.json().catch((cause) => {
    throw new BookingApiError({
      code: "BOOKING_API_INVALID_PAYLOAD",
      message: "Booking API returned invalid JSON.",
      retryable: false,
      cause,
    });
  });

  try {
    return schema.parse(payload);
  } catch (cause) {
    throw new BookingApiError({
      code: "BOOKING_API_INVALID_PAYLOAD",
      message: "Booking API payload does not match the expected contract.",
      retryable: false,
      cause,
    });
  }
};

export const loadPublicBookings = async (tenantId: string, options?: { privateTenant?: boolean }) => {
  const bookables = await fetchBookingJson(`/api/${tenantId}/bookables/public`, publicBookablesSchema);
  return bookables
    .filter((bookable) => bookable.isPublic)
    .map((bookable) => mapBookableToBooking(bookable, options));
};

export const loadBookableOccupancy = async (
  tenantId: string,
  bookableId: string,
  searchParams?: Record<string, string | number | undefined>,
) => {
  const occupancy = await fetchBookingJson(
    `/api/${tenantId}/bookables/${bookableId}/occupancy`,
    occupancySchema,
    searchParams,
  );
  return mapOccupancyToAvailability(occupancy);
};
