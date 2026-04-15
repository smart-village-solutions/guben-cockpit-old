import type { Booking, BookingPrice, BookingAvailability, Ticket } from "@/stores/bookingStore";
import type { BookingApiBookable, BookingApiOccupancy } from "./schemas";
import { buildBookingPortalUrl } from "./config";

const FALLBACK_IMAGE_URL = "/images/guben-city-booking-card-placeholder.png";

const formatPrice = (price: BookingApiBookable["priceCategories"][number]): BookingPrice => ({
  price:
    typeof price.priceEur === "number"
      ? `${price.priceEur.toLocaleString("de-DE", {
          minimumFractionDigits: price.priceEur % 1 === 0 ? 0 : 2,
          maximumFractionDigits: 2,
        })} EUR`
      : "Auf Anfrage",
  interval: price.unit ?? undefined,
  category: price.external ? "extern" : undefined,
});

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
  price: bookable.priceCategories[0] ? formatPrice(bookable.priceCategories[0]).price : "Auf Anfrage",
  prices: bookable.priceCategories.map(formatPrice),
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
    price: defaultTicket.price,
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
