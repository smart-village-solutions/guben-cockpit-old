import type { Booking, BookingPrice, BookingAvailability, Ticket } from "@/stores/bookingStore";
import type { BookingApiBookable, BookingApiOccupancy } from "./schemas";
import { buildBookingPortalUrl } from "./config";

const FALLBACK_IMAGE_URL = "/images/guben-city-booking-card-placeholder.png";

const formatAmount = (amount: number) => `${amount.toLocaleString("de-DE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})} €`;

const formatUnit = (unit: string | null | undefined) => {
  const value = unit?.trim();
  switch (value?.toLowerCase()) {
    case "hour":
    case "per-hour":
      return "pro Stunde";
    case "day":
    case "per-day":
      return "pro Tag";
    case "month":
    case "per-month":
      return "pro Monat";
    default:
      return value || undefined;
  }
};

const formatInterval = (
  price: BookingApiBookable["priceCategories"][number],
  priceType: BookingApiBookable["priceType"],
) => {
  if (priceType === "per-hour" && price.interval) {
    const { start, end } = price.interval;
    const from = Number(start);
    const to = Number(end);
    if (start.trim() && end.trim() && Number.isFinite(from) && Number.isFinite(to) && from >= 0 && to > from) {
      return `${from} - ${to} Std.`;
    }
  }
  return formatUnit(price.unit);
};

const formatPrice = (
  price: BookingApiBookable["priceCategories"][number],
  priceType: BookingApiBookable["priceType"],
): BookingPrice => ({
  price:
    typeof price.priceEur === "number"
      ? formatAmount(price.priceEur)
      : "Auf Anfrage",
  interval: formatInterval(price, priceType),
  category: price.external ? "extern" : undefined,
});

const formatStartingPrice = (bookable: BookingApiBookable) => {
  const amounts = bookable.priceCategories
    .map((category) => category.priceEur)
    .filter((amount): amount is number => typeof amount === "number");
  if (amounts.length === 0) return "Auf Anfrage";
  const amount = formatAmount(Math.min(...amounts));
  const prefix = amounts.length > 1 ? "ab " : "";
  const units = bookable.priceCategories
    .filter((category) => typeof category.priceEur === "number")
    .map((category) => formatUnit(category.unit));
  const sharedUnit = units[0] && units.every((value) => value === units[0]) ? units[0] : undefined;
  const unit = bookable.priceType === "per-hour" ? "pro Stunde" : sharedUnit;
  return `${prefix}${amount}${unit ? ` ${unit}` : ""}`;
};

const deriveCategory = (bookable: BookingApiBookable, privateTenant: boolean) => {
  if (privateTenant) {
    return "private";
  }

  if (bookable.type === "resource") {
    return "resource";
  }

  if (bookable.flags.some((flag) => flag.toLowerCase().includes("sport"))) {
    return "sport";
  }

  return "room";
};

const createDefaultTicket = (bookable: BookingApiBookable): Ticket => ({
  tenantId: bookable.tenantId,
  title: bookable.title,
  description: bookable.description,
  location: bookable.location.display_address,
  type: bookable.type,
  flags: [...bookable.flags],
  autoCommitNote: bookable.bookingNotes || (bookable.autoCommitBooking ? "Automatische Bestätigung" : ""),
  price: formatStartingPrice(bookable),
  prices: bookable.priceCategories.map((price) => formatPrice(price, bookable.priceType)),
  bookingUrl: buildBookingPortalUrl(bookable.tenantId, bookable.id),
  bkid: bookable.id,
  imgUrl: bookable.imgUrl || FALLBACK_IMAGE_URL,
});

export const mapBookableToBooking = (
  bookable: BookingApiBookable,
  options?: { privateTenant?: boolean },
): Booking => {
  const defaultTicket = createDefaultTicket(bookable);

  return {
    tenantId: bookable.tenantId,
    title: bookable.title,
    description: bookable.description,
    location: bookable.location.display_address,
    type: bookable.type,
    imgUrl: bookable.imgUrl || FALLBACK_IMAGE_URL,
    bookingUrl: defaultTicket.bookingUrl,
    price: defaultTicket.price ?? "Auf Anfrage",
    prices: defaultTicket.prices,
    category: deriveCategory(bookable, options?.privateTenant ?? false),
    flags: [...bookable.flags],
    bkid: bookable.id,
    autoCommitNote: defaultTicket.autoCommitNote,
    tickets: [defaultTicket],
    bookings: [],
    requiresLogin: bookable.requiresLogin,
    isBookable: bookable.isBookable,
    attachments: bookable.attachments
      .filter((attachment) => attachment.url)
      .map((attachment) => ({
        title: attachment.title,
        url: attachment.url!,
        type: attachment.type,
      })),
  };
};

export const mapOccupancyToAvailability = (
  occupancy: BookingApiOccupancy,
): BookingAvailability => ({
  bookableId: occupancy.bookableId,
  title: occupancy.title,
  isAvailable: occupancy.isAvailable,
  totalCapacity: occupancy.totalCapacity ?? null,
  booked: occupancy.booked ?? null,
  remaining: occupancy.remaining ?? null,
});
