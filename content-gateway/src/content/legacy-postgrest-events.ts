import type { EventsContent } from "../../../shared/public-content/contracts.js";
import { distanceInKm } from "./postgrest-content-mapper.js";
import type { EventCategoryRow, EventFilters, EventImageRow, EventUrlRow } from "./postgrest-content-types.js";

const GUBEN_COORDINATES = {
  latitude: 51.95042,
  longitude: 14.7143,
} as const;

export const groupRowsByEvent = <T extends EventCategoryRow | EventUrlRow | EventImageRow>(rows: T[]) => {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    grouped.set(row.event_id, [...(grouped.get(row.event_id) ?? []), row]);
  }
  return grouped;
};

export const filterLegacyEvents = (events: EventsContent["events"]["results"], filters: EventFilters) => {
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

  if (filters.distance && filters.distance > 0) {
    const maxDistance = filters.distance;
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

export const sortLegacyEvents = (events: EventsContent["events"]["results"], filters: EventFilters) => {
  if (filters.sortBy === "title") {
    events.sort(
      (left, right) => (filters.ordering === "desc" ? -1 : 1) * left.title.localeCompare(right.title),
    );
    return;
  }

  events.sort(
    (left, right) =>
      (filters.ordering === "desc" ? -1 : 1) *
      (new Date(left.startDate).getTime() - new Date(right.startDate).getTime()),
  );
};

export const dedupeBookingTenants = <T extends { tenantId: string }>(tenants: T[]) =>
  Array.from(
    tenants.reduce((deduped, tenant) => {
      if (!deduped.has(tenant.tenantId)) {
        deduped.set(tenant.tenantId, tenant);
      }
      return deduped;
    }, new Map<string, T>()),
  ).map(([, tenant]) => tenant);
