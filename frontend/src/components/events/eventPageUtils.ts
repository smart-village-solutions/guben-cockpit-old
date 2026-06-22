import type { BookingEvent } from "@/stores/eventStore";
import type { Category, Event } from "@shared/public-content/contracts";

export type BookingCalendarEvent = Event & { isBookingEvent?: boolean };

export type EventPageFilters = {
  distance?: number;
  search?: string;
  category?: string;
  dateRange?: {
    from: Date;
    to?: Date;
  };
  sortBy?: string;
  ordering?: string;
};

const GUBEN_COORDINATES = {
  latitude: 51.95042,
  longitude: 14.7143,
};

export const buildEventsQueryFilters = (filters: EventPageFilters) => ({
  ...(filters.search ? { title: filters.search } : {}),
  ...(filters.distance ? { distance: filters.distance } : {}),
  ...(filters.category ? { category: filters.category } : {}),
  ...(filters.dateRange?.from ? { startDate: filters.dateRange.from.toISOString() } : {}),
  ...(filters.dateRange?.to ? { endDate: filters.dateRange.to.toISOString() } : {}),
  ...(filters.sortBy ? { sortBy: filters.sortBy } : {}),
  ...(filters.ordering ? { ordering: filters.ordering } : {}),
});

export const normalizeBookingEvent = (event: BookingEvent): BookingCalendarEvent => {
  const { start, end } = parseBookingDateRange(event.date);
  const street = [event.details?.street, event.details?.houseNumber]
    .filter((part) => typeof part === "string" && part.trim().length > 0)
    .join(" ");

  return {
    id: event.bkid,
    eventId: `booking:${event.bkid}`,
    terminId: `booking:${event.bkid}`,
    title: event.title,
    description: event.details?.longDescription || event.teaser,
    isHtmlDescription: true,
    startDate: start,
    endDate: end,
    location: {
      id: event.bkid,
      name: event.details?.eventLocation || "",
      city: event.details?.city ?? null,
      street: street || null,
      telephoneNumber: event.contactPhone || null,
      fax: null,
      email: event.contactEmail || null,
      website: null,
      zip: event.details?.zip ?? null,
    },
    coordinates: event.coordinates ?? null,
    urls: [],
    categories: (event.flags ?? []).map((flag) => ({
      id: flag,
      name: flag,
    })),
    images: event.imgUrl
      ? [
          {
            thumbnailUrl: event.details?.teaserImage || event.imgUrl,
            previewUrl: event.imgUrl,
            originalUrl: event.imgUrl,
          },
        ]
      : [],
    published: true,
    isBookingEvent: true,
  } as BookingCalendarEvent;
};

export const filterBookingEvents = (
  events: BookingCalendarEvent[],
  activeFilters: EventPageFilters,
) =>
  events.filter((event) => {
    if (activeFilters.search && !event.title.toLowerCase().includes(activeFilters.search.toLowerCase())) {
      return false;
    }

    if (activeFilters.category && !event.categories.some((category) => category.id === activeFilters.category)) {
      return false;
    }

    if (activeFilters.distance && activeFilters.distance > 0) {
      if (!event.coordinates?.latitude || !event.coordinates?.longitude) {
        return false;
      }

      const distance = calculateDistanceInKm(
        GUBEN_COORDINATES.latitude,
        GUBEN_COORDINATES.longitude,
        event.coordinates.latitude,
        event.coordinates.longitude,
      );
      if (distance > activeFilters.distance) {
        return false;
      }
    }

    if (activeFilters.dateRange?.from || activeFilters.dateRange?.to) {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      const filterStart = activeFilters.dateRange?.from ?? new Date(-8640000000000000);
      const filterEnd = activeFilters.dateRange?.to ?? new Date(8640000000000000);
      if (!(eventStart <= filterEnd && eventEnd >= filterStart)) {
        return false;
      }
    }

    return true;
  });

export const mergeEventsWithBookingEvents = (
  backendEvents: Event[],
  bookingEvents: BookingCalendarEvent[],
) => {
  if (!backendEvents.length) {
    return [...bookingEvents];
  }

  const earliest = new Date(backendEvents[0].startDate).getTime();
  const latest = new Date(backendEvents[backendEvents.length - 1].startDate).getTime();
  const filteredBookingEvents = bookingEvents.filter((event) => {
    if (backendEvents.length < 25) {
      return true;
    }

    const start = new Date(event.startDate).getTime();
    return start >= earliest && start <= latest;
  });

  return [...backendEvents, ...filteredBookingEvents].toSorted(
    (left, right) => new Date(left.startDate).getTime() - new Date(right.startDate).getTime(),
  );
};

export const buildCombinedCategories = (
  backendCategories: Category[],
  bookingEvents: BookingEvent[],
) =>
  Array.from(
    new Map(
      [
        ...backendCategories,
        ...Array.from(new Set(bookingEvents.flatMap((event) => event.flags ?? []))).map((name) => ({
          id: name,
          name,
        })),
      ].map((category) => [category.id, category]),
    ).values(),
  );

const parseBookingDateRange = (value: string) => {
  const [startDate, endDate] = value.split(" - ");
  const start = toIsoDateTime(startDate);
  const end = endDate.includes(".") ? toIsoDateTime(endDate) : toIsoDateTime(`${extractDate(startDate)} ${endDate}`);

  return {
    start,
    end: end || start,
  };
};

const extractDate = (value: string) => value.match(/(\d{2})\.(\d{2})\.(\d{4})/)?.[0] ?? "";

const toIsoDateTime = (value: string) =>
  value.replace(/(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})/, "$3-$2-$1T$4:$5");

const toRadians = (angle: number) => (Math.PI * angle) / 180.0;

const calculateDistanceInKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const radius = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
