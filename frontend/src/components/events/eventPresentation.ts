import type { Event, EventDetailContent } from "@shared/public-content/contracts";

export type BookingEventView = Event & { isBookingEvent?: boolean };

export const containsHtmlMarkup = (value: string) => {
  let insideTag = false;
  let hasContent = false;

  for (const char of value) {
    if (char === ">") {
      if (insideTag && hasContent) {
        return true;
      }
      insideTag = false;
      hasContent = false;
    } else if (char === "<" && !insideTag) {
      insideTag = true;
    } else if (insideTag) {
      hasContent = true;
    }
  }

  return false;
};

export const isBookingEvent = (event: Event): event is BookingEventView =>
  Boolean((event as BookingEventView).isBookingEvent);

export const buildDetailImages = (event: EventDetailContent["event"]) =>
  event.images.map((image) => ({
    src: image.originalUrl,
    alt: event.title,
  }));
