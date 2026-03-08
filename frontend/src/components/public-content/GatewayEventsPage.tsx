import { PaginationContainer } from "@/components/DataDisplay/PaginationContainer";
import CitizenInformationSystemBanner from "@/components/events/citizenInformationSystemBanner";
import EventCard from "@/components/events/eventCard";
import EventIntegration from "@/components/events/eventIntegration";
import SortFilter, { SortOption, SortOrder } from "@/components/events/sortFilter";
import { CategoryFilter } from "@/components/filters/categoryFilter";
import { DateRangeFilter } from "@/components/filters/dateRangeFilter";
import { DistanceFilter } from "@/components/filters/DistanceFilter";
import { SearchFilter } from "@/components/filters/searchFilter";
import { Skeleton } from "@/components/ui/skeleton";
import { usePagination } from "@/hooks/usePagination";
import {
  useGatewayEventsContent,
} from "@/public-content/hooks";
import { isGatewayPublicContentEnabled } from "@/public-content/source";
import { useRouteMetadata } from "@/public-content/useRouteMetadata";
import { useEventStore } from "@/stores/eventStore";
import { Language } from "@/utilities/i18n/Languages";
import { translateBatchedMultiple, translateHtmlBatchedMultiple } from "@/utilities/translateUtils";
import i18next from "i18next";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Markdown from "react-markdown";
import { z } from "zod";

import { PublicContentErrorState } from "./PublicContentErrorState";
import { PublicContentDisabledState } from "./PublicContentDisabledState";
import type { Category, Event, EventImage, EventsContent } from "@shared/public-content/contracts";

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

export const GatewayEventsPage = () => {
  const { t } = useTranslation(["common", "events"]);
  const bookingEvents = useEventStore((state) => state.events);
  const processedTenants = useEventStore((state) => state.processedTenants);
  const markProcessedTenants = useEventStore((state) => state.markProcessedTenants);

  const [currentTenantIndex, setCurrentTenantIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(
    filtersSchema.parse({
      dateRange: { from: new Date() },
      distance: 10,
    }),
  );

  const pagination = usePagination();
  const query = useGatewayEventsContent({
    pageNumber: pagination.page,
    pageSize: pagination.pageSize,
    ...(filters.search && { title: filters.search }),
    ...(filters.distance && { distance: filters.distance }),
    ...(filters.category && { category: filters.category }),
    ...(filters.dateRange?.from && { startDate: filters.dateRange.from.toISOString() }),
    ...(filters.dateRange?.to && { endDate: filters.dateRange.to.toISOString() }),
    ...(filters.sortBy && { sortBy: filters.sortBy }),
    ...(filters.ordering && { ordering: filters.ordering }),
  });
  useRouteMetadata(query.data?.seo);

  if (!isGatewayPublicContentEnabled) {
    return <PublicContentDisabledState />;
  }

  const tenantIds = query.data?.events.bookingTenants ?? [];

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

  const currentTenant = tenantIds[currentTenantIndex];
  const shouldShowIntegration = currentTenant && !processedTenants.has(currentTenant.tenantId);

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
      setFilters(parsed.data);
      pagination.setPageIndex(1);
    } else {
      setFilters(filtersSchema.parse(undefined));
      pagination.setPageIndex(1);
    }
  };

  const normalizedEvents = bookingEvents.map((event) => {
    const [startDateStr, endDateStr] = event.date.split(" - ");
    const start = startDateStr.replace(
      /(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})/,
      "$3-$2-$1T$4:$5",
    );

    let end: string;
    if (endDateStr.includes(".")) {
      end = endDateStr.replace(
        /(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})/,
        "$3-$2-$1T$4:$5",
      );
    } else {
      const startDate = startDateStr.match(/(\d{2})\.(\d{2})\.(\d{4})/)?.[0];
      end = startDate
        ? `${startDate} ${endDateStr}`.replace(
            /(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})/,
            "$3-$2-$1T$4:$5",
          )
        : start;
    }

    const location: Event["location"] = {
      id: crypto.randomUUID(),
      name: event.details?.eventLocation || "",
      city: event.details?.city,
      street: event.details?.street,
      telephoneNumber: event.contactPhone,
      fax: null,
      email: event.contactEmail,
      website: null,
      zip: event.details?.zip,
    };

    const categories: Category[] = (event.flags ?? []).map((flag) => ({
      id: crypto.randomUUID(),
      name: flag,
    }));

    const images: EventImage[] = event.imgUrl
      ? [
          {
            thumbnailUrl: event.details?.teaserImage || event.imgUrl,
            previewUrl: event.imgUrl,
            originalUrl: event.imgUrl,
          },
        ]
      : [];

    return {
      id: event.bkid,
      eventId: crypto.randomUUID(),
      terminId: crypto.randomUUID(),
      title: event.title,
      description: event.details?.longDescription || event.teaser,
      isHtmlDescription: true,
      startDate: start,
      endDate: end,
      location,
      coordinates: event.coordinates,
      urls: [],
      categories,
      images,
      published: true,
      isBookingEvent: true,
    };
  }) as (Event & { isBookingEvent?: boolean })[];

  const filterBookingEvents = (
    events: (Event & { isBookingEvent?: boolean })[],
    activeFilters: FiltersType,
  ) =>
    events.filter((event) => {
      if (
        activeFilters.search &&
        !event.title.toLowerCase().includes(activeFilters.search.toLowerCase())
      ) {
        return false;
      }

      if (activeFilters.distance && activeFilters.distance > 0) {
        if (!event.coordinates?.latitude || !event.coordinates?.longitude) {
          return false;
        }

        const d = calculateDistanceInKm(
          51.95042,
          14.7143,
          event.coordinates.latitude,
          event.coordinates.longitude,
        );
        if (d > activeFilters.distance) {
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

  const filteredNormalizedEvents = filterBookingEvents(normalizedEvents, filters);
  const allEvents = mergeEventsWithCustom(query.data?.events.results ?? [], filteredNormalizedEvents);

  useEffect(() => {
    pagination.setTotal(allEvents.length);
    pagination.setPageCount(query.data?.events.pageCount ?? 1);
  }, [allEvents.length, query.data]);

  const currentLang = i18next.language as Language;
  const [translationsReady, setTranslationsReady] = useState(false);

  useEffect(() => {
    setTranslationsReady(false);

    if (!shouldShowIntegration && currentLang !== "de") {
      const customEvents = (allEvents as (Event & { isBookingEvent?: boolean })[]).filter(
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

  const combinedCategories = Array.from(
    new Map(
      [
        ...(query.data?.events.categories ?? []),
        ...Array.from(new Set(bookingEvents.flatMap((event) => event.flags ?? []))).map((name) => ({
          id: name,
          name,
        })),
      ].map((category) => [category.id, category]),
    ).values(),
  );

  if (query.isPending) {
    return (
      <main className="relative space-y-8 mb-8">
        <section className="space-y-4 max-w-7xl mx-auto pt-10">
          <Skeleton className="h-10 w-72 mx-auto" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-2/3 mx-auto" />
        </section>
      </main>
    );
  }

  if (query.error || !query.data) {
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

      <section className="space-y-8 max-w-7xl mx-auto">
        <div className="text-center space-y-4">
          <h1 className="text-5xl">{query.data.page.title}</h1>
          {query.data.page.description && (
            <div className="prose prose-neutral mx-auto max-w-3xl">
              <Markdown>{query.data.page.description}</Markdown>
            </div>
          )}
        </div>

        <div className="flex items-end gap-2">
          <div className="w-full grid grid-cols-5 gap-2">
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

      <section className="max-w-7xl mx-auto flex flex-col gap-4">
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
          {translationsReady
            ? allEvents.map((event) => <EventCard key={event.id} event={event} />)
            : Array.from({ length: pagination.pageSize }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="w-full h-48 sm:h-60 md:h-64 lg:h-72 rounded-md p-4 mb-4"
                />
              ))}
        </PaginationContainer>
      </section>
    </main>
  );
};

function toRadians(angle: number): number {
  return (Math.PI * angle) / 180.0;
}

function mergeEventsWithCustom(
  backendEvents: Event[],
  bookingEvents: (Event & { isBookingEvent?: boolean })[],
) {
  if (!backendEvents.length) {
    return [...bookingEvents];
  }

  const earliest = new Date(backendEvents[0].startDate).getTime();
  const latest = new Date(backendEvents[backendEvents.length - 1].startDate).getTime();

  const filteredCustom = bookingEvents.filter((event) => {
    const start = new Date(event.startDate).getTime();

    if (backendEvents.length < 25) {
      return true;
    }

    return start >= earliest && start <= latest;
  });

  const combined = [...backendEvents, ...filteredCustom];
  combined.sort((left, right) => new Date(left.startDate).getTime() - new Date(right.startDate).getTime());
  return combined;
}

function calculateDistanceInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
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
}
