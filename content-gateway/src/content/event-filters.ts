import type { Event } from "../../../shared/public-content/contracts.js";
import { distanceInKm } from "./postgrest-content-mapper.js";
import type { EventFilters } from "./postgrest-content-types.js";

const GUBEN_COORDINATES = {
  latitude: 51.95042,
  longitude: 14.7143,
} as const;

export const filterEvents = <T extends Event>(events: T[], filters: EventFilters): T[] => {
  let results = events;

  if (filters.title) {
    const needle = filters.title.toLowerCase();
    results = results.filter((event) => event.title.toLowerCase().includes(needle));
  }

  if (filters.category) {
    results = results.filter((event) =>
      event.categories.some((category) => category.id === filters.category),
    );
  }

  const startDate = filters.startDate ? new Date(filters.startDate) : undefined;
  const endDate = filters.endDate ? new Date(filters.endDate) : undefined;
  if (startDate || endDate) {
    results = results.filter((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return (!startDate || eventEnd >= startDate) && (!endDate || eventStart <= endDate);
    });
  }

  const maxDistance = filters.distance;
  if (maxDistance && maxDistance > 0) {
    results = results.filter((event) => {
      if (!event.coordinates) {
        return false;
      }

      return (
        distanceInKm(
          GUBEN_COORDINATES.latitude,
          GUBEN_COORDINATES.longitude,
          event.coordinates.latitude,
          event.coordinates.longitude,
        ) <= maxDistance
      );
    });
  }

  return results;
};
