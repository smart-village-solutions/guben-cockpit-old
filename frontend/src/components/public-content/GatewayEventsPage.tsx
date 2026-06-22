import { PaginationContainer } from "@/components/DataDisplay/PaginationContainer";
import CitizenInformationSystemBanner from "@/components/events/citizenInformationSystemBanner";
import EventCard from "@/components/events/eventCard";
import EventIntegration from "@/components/events/eventIntegration";
import {
  buildCombinedCategories,
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
import { usePagination } from "@/hooks/usePagination";
import { useGatewayEventsContent } from "@/public-content/hooks";
import { isGatewayPublicContentEnabled } from "@/public-content/source";
import { useRouteMetadata } from "@/public-content/useRouteMetadata";
import { useEventStore } from "@/stores/eventStore";
import { Language } from "@/utilities/i18n/Languages";
import { translateBatchedMultiple, translateHtmlBatchedMultiple } from "@/utilities/translateUtils";
import i18next from "i18next";
import { startTransition, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { PublicContentErrorState } from "./PublicContentErrorState";
import { PublicContentDisabledState } from "./PublicContentDisabledState";
import type { EventsContent } from "@shared/public-content/contracts";

const filtersSchema = z
  .object({
    distance: z.number().optional(),
    search: z.string().optional(),
    category: z.string().optional(),
    dateRange: z
      .object({
        from: z.date(),
        to: z.date().optional(),
      })
      .optional(),
    sortBy: z.nativeEnum(SortOption).optional(),
    ordering: z.nativeEnum(SortOrder).optional(),
  })
  .default({});

type FiltersType = z.infer<typeof filtersSchema>;

const GatewayEventsPageContent = () => {
  const { t } = useTranslation(["common", "events"]);
  const bookingEvents = useEventStore((state) => state.events);
  const processedTenants = useEventStore((state) => state.processedTenants);
  const markProcessedTenants = useEventStore((state) => state.markProcessedTenants);

  const [currentTenantIndex, setCurrentTenantIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(() => filtersSchema.parse({}));

  const pagination = usePagination();
  const query = useGatewayEventsContent({
    pageNumber: pagination.page,
    pageSize: pagination.pageSize,
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

  const handleFilterChange = (newFilters: Partial<{ [key in keyof FiltersType]: unknown }>) => {
    const updated = { ...filters, ...newFilters };
    const parsed = filtersSchema.safeParse(updated);
    if (parsed.success) {
      startTransition(() => {
        setFilters(parsed.data);
        pagination.setPageIndex(1);
      });
    } else {
      startTransition(() => {
        setFilters(filtersSchema.parse(undefined));
        pagination.setPageIndex(1);
      });
    }
  };

  const normalizedEvents = bookingEvents.map((event) => normalizeBookingEvent(event));
  const filteredNormalizedEvents = filterBookingEvents(normalizedEvents, filters);
  const allEvents = mergeEventsWithBookingEvents(query.data?.events.results ?? [], filteredNormalizedEvents);

  useEffect(() => {
    pagination.setTotal(allEvents.length);
    pagination.setPageCount(query.data?.events.pageCount ?? 1);
  }, [allEvents.length, query.data]);

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
          .filter((description) => description && description.trim());
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

  const combinedCategories = buildCombinedCategories(query.data?.events.categories ?? [], bookingEvents);

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
              value={filters.search ?? null}
              onChange={(value) => handleFilterChange({ search: value })}
            />
            <CategoryFilter
              value={filters.category ?? null}
              onChange={(value) => handleFilterChange({ category: value })}
              categories={combinedCategories}
            />
            <DistanceFilter
              value={filters.distance?.toString()}
              onChange={(value) =>
                handleFilterChange({ distance: value ? Number.parseInt(value, 10) : undefined })
              }
            />
            <DateRangeFilter
              value={filters.dateRange}
              onChange={(range) => handleFilterChange({ dateRange: range })}
            />
          </div>

          <SortFilter
            option={filters.sortBy}
            order={filters.ordering}
            onChange={(option, order) => handleFilterChange({ sortBy: option, ordering: order })}
          />
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4">
        <PaginationContainer
          nextPage={pagination.nextPage}
          previousPage={pagination.previousPage}
          setPageIndex={pagination.setPageIndex}
          setPageSize={pagination.setPageSize}
          total={pagination.total}
          pageCount={pagination.pageCount}
          pageSize={pagination.pageSize}
          page={pagination.page}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-4">
            {/* Show events immediately if available, otherwise show skeleton */}
            {allEvents.length > 0
              ? allEvents.map((event) => (
                  <div key={event.id} className="flex w-full">
                    <EventCard event={event} />
                  </div>
                ))
              : // Show loading skeletons only if no events yet and query is pending
                query.isPending
                ? Array.from({ length: pagination.pageSize }).map((_, index) => (
                    <Skeleton
                      key={index}
                      className="w-full h-96 rounded-lg"
                    />
                  ))
                : null}
          </div>
        </PaginationContainer>
      </section>
    </main>
  );
};

export const GatewayEventsPage = () => {
  if (!isGatewayPublicContentEnabled) {
    return <PublicContentDisabledState />;
  }

  return <GatewayEventsPageContent />;
};
