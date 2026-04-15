import { trimTrailingSlashes } from "@/utilities/urlUtils";
import { BookingApiError } from "./errors";

const readConfiguredBookingApiUrl = () => import.meta.env.VITE_BOOKING_API_URL?.trim();

const inferBookingAppUrl = (apiUrl: string) => {
  const parsed = new URL(apiUrl);

  if (parsed.hostname.includes("-api.")) {
    parsed.hostname = parsed.hostname.replace("-api.", ".");
  } else if (parsed.hostname.includes("api.")) {
    parsed.hostname = parsed.hostname.replace("api.", "");
  }

  parsed.pathname = "/";
  parsed.search = "";
  parsed.hash = "";

  return trimTrailingSlashes(parsed.toString());
};

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

export const getBookingAppBaseUrl = () => inferBookingAppUrl(getBookingApiBaseUrl());

export const buildBookingPortalUrl = (tenantId: string, bookableId: string) => {
  const bookingAppBaseUrl = getBookingAppBaseUrl();
  const url = new URL("/", bookingAppBaseUrl);
  url.searchParams.set("tenantId", tenantId);
  url.searchParams.set("bookableId", bookableId);
  return url.toString();
};
