import {
  eventDetailContentSchema,
  eventsContentSchema,
} from "../../../shared/public-content/contracts.js";
import type {
  Event,
  EventDetailContent,
  EventsContent,
  PageHero,
  SeoMetadata,
} from "../../../shared/public-content/contracts.js";
import { GatewayError } from "../errors.js";
import type { SmartVillageEventRecord } from "../upstream/smart-village-types.js";
import { TTLCache } from "../upstream/ttl-cache.js";
import type { EventFilters } from "./content-repository.js";
import { distanceInKm } from "./postgrest-content-mapper.js";
import { SmartVillageEventMapper } from "./smart-village-event-mapper.js";

const DEFAULT_CACHE_TTL_MS = 60_000;
const GUBEN_COORDINATES = {
  latitude: 51.95042,
  longitude: 14.7143,
} as const;

const EVENT_RECORD_FIELDS = `
  id
  externalId
  title
  description
  visible
  categories {
    id
    name
  }
  addresses {
    street
    zip
    city
    geoLocation {
      latitude
      longitude
    }
  }
  location {
    id
    name
    geoLocation {
      latitude
      longitude
    }
  }
  date {
    dateStart
    dateEnd
    timeStart
    timeEnd
    timeDescription
    weekday
    useOnlyTimeDescription
  }
  dates {
    dateStart
    dateEnd
    timeStart
    timeEnd
    timeDescription
    weekday
    useOnlyTimeDescription
  }
  urls {
    description
    url
  }
  mediaContents {
    sourceUrl {
      url
      description
    }
  }
`;

const EVENT_RECORDS_QUERY = `
  query SmartVillageEventRecords {
    eventRecords {
      ${EVENT_RECORD_FIELDS}
    }
  }
`;

const EVENT_RECORD_QUERY = `
  query SmartVillageEventRecord($id: ID!) {
    eventRecord(id: $id) {
      ${EVENT_RECORD_FIELDS}
    }
  }
`;

type SmartVillageEventRepositoryOptions = {
  client: {
    request<T>(query: string, variables?: Record<string, unknown>): Promise<T>;
  };
  publicBaseUrl: string;
  warn?: (message: string, context: Record<string, unknown>) => void;
  cacheTtlMs?: number;
  now?: () => number;
  mapper?: SmartVillageEventMapper;
};

type EventRecordsQueryResponse = {
  eventRecords: SmartVillageEventRecord[] | null;
};

type EventRecordQueryResponse = {
  eventRecord: SmartVillageEventRecord | null;
};

type ParsedOccurrenceId = {
  internalId: string;
  canonicalId: string;
};

const localizedEventsPageCopy: Record<string, { title: string; description: string }> = {
  de: {
    title: "Veranstaltungen",
    description: "Alle oeffentlichen Veranstaltungen an einem Ort.",
  },
  en: {
    title: "Events",
    description: "All public events in one place.",
  },
  pl: {
    title: "Wydarzenia",
    description: "Wszystkie publiczne wydarzenia w jednym miejscu.",
  },
};

const notFoundError = () =>
  new GatewayError({
    code: "NOT_FOUND",
    message: "Requested event was not found",
    statusCode: 404,
    upstream: "gateway",
    retryable: false,
  });

const invalidPayloadError = (message: string) =>
  new GatewayError({
    code: "INVALID_UPSTREAM_PAYLOAD",
    message,
    statusCode: 502,
    upstream: "smartvillage",
    retryable: false,
  });

const normalizeLanguage = (language: string) => language.trim().slice(0, 2).toLowerCase() || "de";

const normalizeFilters = (filters: EventFilters) => ({
  pageNumber: filters.pageNumber,
  pageSize: filters.pageSize,
  title: filters.title ?? null,
  category: filters.category ?? null,
  startDate: filters.startDate ?? null,
  endDate: filters.endDate ?? null,
  sortBy: filters.sortBy ?? null,
  ordering: filters.ordering ?? null,
  distance: filters.distance ?? null,
});

export class SmartVillageEventRepository {
  private readonly mapper: SmartVillageEventMapper;
  private readonly listCache: TTLCache<string, EventsContent>;
  private readonly detailCache: TTLCache<string, EventDetailContent>;

  public constructor(private readonly options: SmartVillageEventRepositoryOptions) {
    const cacheOptions = {
      ttlMs: options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS,
      now: options.now,
    };

    this.mapper = options.mapper ?? new SmartVillageEventMapper();
    this.listCache = new TTLCache<string, EventsContent>(cacheOptions);
    this.detailCache = new TTLCache<string, EventDetailContent>(cacheOptions);
  }

  public async getEvents(language: string, filters: EventFilters): Promise<EventsContent> {
    const normalizedLanguage = normalizeLanguage(language);
    const cacheKey = JSON.stringify([normalizedLanguage, normalizeFilters(filters)]);

    return this.listCache.getOrLoad(cacheKey, async () => this.loadEvents(normalizedLanguage, filters));
  }

  public async getEventById(language: string, id: string): Promise<EventDetailContent> {
    const normalizedLanguage = normalizeLanguage(language);
    const parsedOccurrenceId = this.parseOccurrenceId(id);
    const cacheKey = JSON.stringify([
      normalizedLanguage,
      parsedOccurrenceId?.canonicalId ?? id,
    ]);

    return this.detailCache.getOrLoad(cacheKey, async () =>
      this.loadEventById(normalizedLanguage, id),
    );
  }

  private async loadEvents(language: string, filters: EventFilters): Promise<EventsContent> {
    const response = await this.options.client.request<EventRecordsQueryResponse>(EVENT_RECORDS_QUERY);
    const records = this.expectEventRecords(response);

    let results = records
      .flatMap((record) => this.mapRecordWithDiagnostics(record, "eventRecords"))
      .filter((event) => event.published);

    results = this.filterEvents(results, filters);
    this.sortEvents(results, filters);

    const categories = Array.from(
      new Map(
        results.flatMap((event) => event.categories).map((category) => [category.id, category]),
      ).values(),
    );

    const startIndex = (filters.pageNumber - 1) * filters.pageSize;
    const page = this.createEventsPage(language);

    return eventsContentSchema.parse({
      page,
      events: {
        pageNumber: filters.pageNumber,
        pageSize: filters.pageSize,
        totalCount: results.length,
        pageCount: Math.max(1, Math.ceil(results.length / filters.pageSize)),
        results: results.slice(startIndex, startIndex + filters.pageSize),
        categories,
        bookingTenants: [],
      },
      seo: page.seo,
    });
  }

  private async loadEventById(language: string, id: string): Promise<EventDetailContent> {
    const parsedOccurrenceId = this.parseOccurrenceId(id);
    if (!parsedOccurrenceId) {
      throw notFoundError();
    }

    const response = await this.options.client.request<EventRecordQueryResponse>(
      EVENT_RECORD_QUERY,
      { id: parsedOccurrenceId.internalId },
    );

    if (!Object.hasOwn(response, "eventRecord")) {
      throw invalidPayloadError("smartvillage eventRecord response did not include eventRecord");
    }

    if (response.eventRecord === null) {
      throw notFoundError();
    }

    const event = this.mapRecordWithDiagnostics(response.eventRecord, "eventRecord").find(
      (candidate) => candidate.id === parsedOccurrenceId.canonicalId && candidate.published,
    );

    if (!event) {
      throw notFoundError();
    }

    return eventDetailContentSchema.parse({
      event,
      seo: this.createSeo(`/events/${event.id}`, event.title, event.description),
    });
  }

  private expectEventRecords(response: EventRecordsQueryResponse): SmartVillageEventRecord[] {
    if (!Array.isArray(response.eventRecords)) {
      throw invalidPayloadError("smartvillage eventRecords response did not include an array");
    }

    return response.eventRecords;
  }

  private parseOccurrenceId(value: string): ParsedOccurrenceId | null {
    const firstSeparator = value.indexOf(":");
    const secondSeparator =
      firstSeparator >= 0 ? value.indexOf(":", firstSeparator + 1) : -1;

    if (firstSeparator <= 0 || secondSeparator <= firstSeparator + 1 || secondSeparator >= value.length - 1) {
      return null;
    }

    try {
      const internalId = decodeURIComponent(value.slice(0, firstSeparator));
      const dateStart = decodeURIComponent(value.slice(firstSeparator + 1, secondSeparator));
      const occurrenceTime = decodeURIComponent(value.slice(secondSeparator + 1));

      if (internalId.length === 0) {
        return null;
      }

      return {
        internalId,
        canonicalId: [
          encodeURIComponent(internalId),
          encodeURIComponent(dateStart),
          encodeURIComponent(occurrenceTime),
        ].join(":"),
      };
    } catch {
      return null;
    }
  }

  private mapRecordWithDiagnostics(
    record: SmartVillageEventRecord,
    source: "eventRecords" | "eventRecord",
  ) {
    const mappedEvents = this.mapper.eventsFromRecord(record);
    const occurrenceCandidates = this.getOccurrenceCandidateCount(record);

    if (occurrenceCandidates > mappedEvents.length) {
      this.options.warn?.(
        "Skipped malformed Smart Village event record/occurrence during mapping",
        {
          source,
          internalId: record.id ?? null,
          externalId: record.externalId ?? null,
          title: record.title ?? null,
          occurrenceCandidates,
          mappedOccurrences: mappedEvents.length,
        },
      );
    }

    return mappedEvents;
  }

  private getOccurrenceCandidateCount(record: SmartVillageEventRecord) {
    if (Array.isArray(record.dates) && record.dates.length > 0) {
      return record.dates.length;
    }

    return record.date ? 1 : 0;
  }

  private filterEvents(events: Event[], filters: EventFilters) {
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
  }

  private sortEvents(events: Event[], filters: EventFilters) {
    const direction = filters.ordering === "desc" ? -1 : 1;

    if (filters.sortBy === "title") {
      events.sort((left, right) => direction * left.title.localeCompare(right.title));
      return;
    }

    events.sort(
      (left, right) =>
        direction * (new Date(left.startDate).getTime() - new Date(right.startDate).getTime()),
    );
  }

  private createEventsPage(language: string): PageHero {
    const copy =
      localizedEventsPageCopy[language] ?? localizedEventsPageCopy.de;

    return {
      id: "Events",
      title: copy.title,
      description: copy.description,
      seo: this.createSeo("/events", copy.title, copy.description),
    };
  }

  private createSeo(path: string, title: string, description: string): SeoMetadata {
    return {
      title: title || "Guben Cockpit",
      description: description || "Oeffentliche Inhalte aus dem Guben Cockpit.",
      canonical: new URL(path, this.options.publicBaseUrl).toString(),
      indexable: true,
    };
  }
}
