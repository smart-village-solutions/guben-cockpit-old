import type { Event, EventDetailContent } from "@shared/public-content/contracts";

export type BookingEventView = Event & { isBookingEvent?: boolean };

export const containsHtmlMarkup = (value: string) => /<[^>]+>/.test(value);

export const isBookingEvent = (event: Event): event is BookingEventView =>
  Boolean((event as BookingEventView).isBookingEvent);

export const buildDetailImages = (event: EventDetailContent["event"]) =>
  event.images.map((image) => ({
    src: image.originalUrl,
    alt: event.title,
  }));
