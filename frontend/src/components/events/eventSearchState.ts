import { SortOption, SortOrder } from "./sortFilter";
import type { EventPageFilters } from "./eventPageUtils";

export type EventsSearch = {
  search?: string;
  category?: string;
  distance?: number;
  from?: string;
  to?: string;
  sortBy?: SortOption;
  ordering?: SortOrder;
  page: number;
  pageSize: number;
};

const text = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : undefined;
const positiveInt = (value: unknown, fallback: number, max = Number.MAX_SAFE_INTEGER) =>
  Number.isSafeInteger(Number(value)) && Number(value) > 0 && Number(value) <= max ? Number(value) : fallback;
const date = (value: unknown) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const parsed = new Date(`${value}T12:00:00`);
  return !Number.isNaN(parsed.getTime()) && formatEventSearchDate(parsed) === value ? value : undefined;
};

export const formatEventSearchDate = (value: Date) =>
  `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;

export const validateEventsSearch = (raw: Record<string, unknown>): EventsSearch => {
  const from = date(raw.from);
  const to = date(raw.to);
  return {
    search: text(raw.search),
    category: text(raw.category),
    distance: [1, 5, 10, 20, 30, 40].includes(Number(raw.distance)) ? Number(raw.distance) : undefined,
    from,
    to: from && to && to >= from ? to : undefined,
    sortBy: Object.values(SortOption).includes(raw.sortBy as SortOption) ? raw.sortBy as SortOption : undefined,
    ordering: Object.values(SortOrder).includes(raw.ordering as SortOrder) ? raw.ordering as SortOrder : undefined,
    page: positiveInt(raw.page, 1),
    pageSize: positiveInt(raw.pageSize, 25, 100),
  };
};

export const eventsSearchToFilters = (search: EventsSearch): EventPageFilters => ({
  search: search.search,
  category: search.category,
  distance: search.distance,
  sortBy: search.sortBy,
  ordering: search.ordering,
  dateRange: search.from ? {
    from: new Date(`${search.from}T00:00:00`),
    to: search.to ? new Date(`${search.to}T00:00:00`) : undefined,
  } : undefined,
});
