import { trimTrailingSlashes } from "@/utilities/urlUtils";
import { BookingApiError } from "./errors";

const readConfiguredBookingApiUrl = () => import.meta.env.VITE_BOOKING_API_URL?.trim();

export const getBookingApiBaseUrl = () => {
  const configuredBookingApiUrl = readConfiguredBookingApiUrl();

  if (!configuredBookingApiUrl) {
    throw new BookingApiError({
      code: "BOOKING_API_CONFIG_ERROR",
      message: "VITE_BOOKING_API_URL is not configured.",
      retryable: false,
    });
  }

  try {
    return trimTrailingSlashes(new URL(configuredBookingApiUrl).toString());
  } catch (cause) {
    throw new BookingApiError({
      code: "BOOKING_API_CONFIG_ERROR",
      message: "VITE_BOOKING_API_URL is invalid.",
      retryable: false,
      cause,
    });
  }
};
