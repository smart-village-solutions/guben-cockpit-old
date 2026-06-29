import type { EventsContent } from "../../../shared/public-content/contracts.js";
import { filterEvents } from "./event-filters.js";
import type { EventCategoryRow, EventFilters, EventImageRow, EventUrlRow } from "./postgrest-content-types.js";

export const groupRowsByEvent = <T extends EventCategoryRow | EventUrlRow | EventImageRow>(rows: T[]) => {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    grouped.set(row.event_id, [...(grouped.get(row.event_id) ?? []), row]);
  }
  return grouped;
};

export const filterLegacyEvents = (events: EventsContent["events"]["results"], filters: EventFilters) => {
  return filterEvents(events, filters);
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
