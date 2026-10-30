import { PaginationContainer } from "@/components/DataDisplay/PaginationContainer";
import CitizenInformationSystemBanner from "@/components/events/citizenInformationSystemBanner";
import EventCard from "@/components/events/eventCard";
import EventIntegration from "@/components/events/eventIntegration";
import {
  buildEventsQueryFilters,
  filterBookingEvents,
  mergeEventsWithBookingEvents,
  normalizeBookingEvent,
  type BookingCalendarEvent,
} from "@/components/events/eventPageUtils";
import SortFilter, { SortOption, SortOrder } from "@/components/events/sortFilter";
import { CategoryFilter } from "@/components/filters/categoryFilter";
import { DateRangeFilter } from "@/components/filters/dateRangeFilter";
import { DistanceFilter } from "@/components/filters/DistanceFilter";
import { SearchFilter } from "@/components/filters/searchFilter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { eventsSearchToFilters, formatEventSearchDate, validateEventsSearch, type EventsSearch } from "@/components/events/eventSearchState";
import { useGatewayEventsContent } from "@/public-content/hooks";
import { isGatewayPublicContentEnabled } from "@/public-content/source";
import { useRouteMetadata } from "@/public-content/useRouteMetadata";
import { useEventStore } from "@/stores/eventStore";
import { Language } from "@/utilities/i18n/Languages";
import { translateBatchedMultiple, translateHtmlBatchedMultiple } from "@/utilities/translateUtils";
import i18next from "i18next";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { PublicContentErrorState } from "./PublicContentErrorState";
import { PublicContentDisabledState } from "./PublicContentDisabledState";
import type { EventsContent } from "@shared/public-content/contracts";

type Props = {
  search: EventsSearch;
  onSearchChange: (search: EventsSearch) => void;
};

const GatewayEventsPageContent = ({ search, onSearchChange }: Props) => {
  const { t } = useTranslation(["common", "events"]);
  const bookingEvents = useEventStore((state) => state.events);
  const processedTenants = useEventStore((state) => state.processedTenants);
  const markProcessedTenants = useEventStore((state) => state.markProcessedTenants);

  const [currentTenantIndex, setCurrentTenantIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const filters = eventsSearchToFilters(search);
  const [inputSearch, setInputSearch] = useState(search.search ?? "");

  // Navigation (including Back/Forward) restores the input and cancels pending typing.
  useEffect(() => { setInputSearch(search.search ?? ""); }, [search]);
  useEffect(() => {
    if (inputSearch.trim() === (search.search ?? "")) return;
    const timer = window.setTimeout(() => {
      onSearchChange(validateEventsSearch({ ...search, search: inputSearch, page: 1 }));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [inputSearch, search, onSearchChange]);

  const query = useGatewayEventsContent({
    pageNumber: search.page,
    pageSize: search.pageSize,
    ...buildEventsQueryFilters(filters),
  });
  useRouteMetadata(query.data?.seo);

  const tenantIds = query.data?.events.bookingTenants ?? [];
  const currentTenant = tenantIds[currentTenantIndex];
  const shouldShowIntegration = Boolean(
    currentTenant && !processedTenants.has(currentTenant.tenantId),
  );
  const currentLang = i18next.language as Language;
  const [translationsReady, setTranslationsReady] = useState(false);

  const handleTenantDone = useCallback(() => {
    const currentTenant = tenantIds[currentTenantIndex];
    if (currentTenant) {
      markProcessedTenants(currentTenant.tenantId);
    }

    const hasMoreTenants = currentTenantIndex < tenantIds.length - 1;
    if (hasMoreTenants) {
      setCurrentTenantIndex((index) => index + 1);
    } else {
      setLoading(false);
    }
  }, [currentTenantIndex, markProcessedTenants, tenantIds]);

  useEffect(() => {
    if (tenantIds.length === 0) {
      setLoading(false);
      return;
    }

    if (shouldShowIntegration) {
      setLoading(true);
    }
  }, [shouldShowIntegration, tenantIds.length]);

  const handleFilterChange = (changes: Partial<EventsSearch>) => {
    onSearchChange(validateEventsSearch({ ...search, search: inputSearch, ...changes, page: 1 }));
  };
  const resetFilters = () => onSearchChange(validateEventsSearch({ pageSize: search.pageSize }));
  const pageCount = query.data?.events.pageCount ?? 1;
  const setPageIndex = (page: number) => {
    if (page >= 1 && page <= pageCount) onSearchChange({ ...search, page });
  };
  const activeFilters = [
    filters.search ? `${t("Search")}: ${filters.search}` : undefined,
    filters.category ? `${t("Category", { ns: "events" })}: ${query.data?.events.categories.find((category) => category.id === filters.category)?.name ?? filters.category}` : undefined,
    filters.distance ? `${t("Radius")}: ${filters.distance} km` : undefined,
    search.from ? `${t("Date")}: ${search.from}${search.to ? ` – ${search.to}` : ""}` : undefined,
  ].filter((value): value is string => Boolean(value));

  const normalizedEvents = bookingEvents.map((event) => normalizeBookingEvent(event));
  const filteredNormalizedEvents = filterBookingEvents(normalizedEvents, filters);
  const allEvents = mergeEventsWithBookingEvents(query.data?.events.results ?? [], filteredNormalizedEvents);

  // Progressive loading: show content immediately, load translations in background
  useEffect(() => {
    // Only set to true if not already loaded and not a booking integration
    if (translationsReady || shouldShowIntegration) return;

    setTranslationsReady(true);

    if (currentLang !== "de") {
      const customEvents = (allEvents as BookingCalendarEvent[]).filter(
        (event) => event.isBookingEvent,
      );
      const translateAll = async () => {
        const descriptions = customEvents
          .map((event) => event.description)
          .filter((description) => description?.trim());
        if (descriptions.length > 0) {
          await translateHtmlBatchedMultiple(descriptions, currentLang);
        }

        const titles = customEvents
          .map((event) => event.title)
          .filter((title) => title && title.trim() !== "");
        if (titles.length > 0) {
          await translateBatchedMultiple([...new Set(titles)], currentLang);
        }

        setTranslationsReady(true);
      };

      void translateAll();
    } else {
      setTranslationsReady(true);
    }
  }, [allEvents, currentLang, shouldShowIntegration]);

  // Show error only if query has failed, not just loading
  if (query.error && !query.data) {
    return <PublicContentErrorState error={query.error} onRetry={() => void query.refetch()} />;
  }

  return (
    <main className="relative space-y-8 mb-8">
      {loading && <Skeleton />}
      {tenantIds.map((tenant: EventsContent["events"]["bookingTenants"][number]) => (
        <EventIntegration
          key={tenant.id}
          tenantId={tenant.tenantId}
          setLoading={setLoading}
          onDone={handleTenantDone}
        />
      ))}
      <CitizenInformationSystemBanner />

      <section className="space-y-8 max-w-7xl mx-auto px-4 w-full">
        <div className="flex items-end gap-2">
          <div className="flex-1 grid grid-cols-5 gap-2">
            <SearchFilter
              className="col-span-2"
              value={inputSearch}
              onChange={(value) => setInputSearch(value ?? "")}
            />
            <CategoryFilter
              value={filters.category ?? null}
              onChange={(value) => handleFilterChange({ category: value ?? undefined })}
              categories={query.data?.events.categories ?? []}
            />
            <DistanceFilter
              value={filters.distance?.toString()}
              onChange={(value) =>
                handleFilterChange({ distance: value ? Number.parseInt(value, 10) : undefined })
              }
            />
            <DateRangeFilter
              value={filters.dateRange}
              onChange={(range) => handleFilterChange({ from: range?.from ? formatEventSearchDate(range.from) : undefined, to: range?.to ? formatEventSearchDate(range.to) : undefined })}
            />
          </div>

          <SortFilter
            option={filters.sortBy}
            order={filters.ordering}
            onChange={(option, order) => handleFilterChange({ sortBy: option as SortOption, ordering: order as SortOrder })}
          />
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4">
        <PaginationContainer
          nextPage={() => setPageIndex(search.page + 1)}
          previousPage={() => setPageIndex(search.page - 1)}
          setPageIndex={setPageIndex}
          setPageSize={(pageSize) => onSearchChange({ ...search, pageSize, page: 1 })}
          total={query.data?.events.totalCount ?? 0}
          pageCount={pageCount}
          pageSize={search.pageSize}
          page={search.page}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-4">
            {!query.isPending && allEvents.length === 0 && (
              <div className="col-span-full text-center space-y-4 py-8" role="status">
                <p>{t("NoMatchingEvents", { ns: "events" })}</p>
                {activeFilters.length > 0 && <>
                  <p>{t("ActiveFilters", { ns: "events" })}</p>
                  <ul className="flex flex-wrap justify-center gap-2">{activeFilters.map((label) => <li key={label} className="rounded bg-muted px-3 py-1">{label}</li>)}</ul>
                  <Button onClick={resetFilters}>{t("ResetFilters", { ns: "events" })}</Button>
                </>}
              </div>
            )}
            <EventResults events={allEvents} isPending={query.isPending} pageSize={search.pageSize} />
          </div>
        </PaginationContainer>
      </section>
    </main>
  );
};

export const GatewayEventsPage = (props: Props) => {
  if (!isGatewayPublicContentEnabled) {
    return <PublicContentDisabledState />;
  }

  return <GatewayEventsPageContent {...props} />;
};


const EventResults = ({ events, isPending, pageSize }: {
  events: Parameters<typeof EventCard>[0]["event"][];
  isPending: boolean;
  pageSize: number;
}) => {
  if (events.length > 0) return events.map((event) => <div key={event.id} className="flex w-full"><EventCard event={event} /></div>);
  if (isPending) {
    const slots = Array.from({ length: pageSize }, (_, slot) => `event-loading-slot-${slot}`);
    return slots.map((slot) => <Skeleton key={slot} className="w-full h-96 rounded-lg" />);
  }
  return null;
};
