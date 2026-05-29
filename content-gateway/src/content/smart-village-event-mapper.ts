import type { Event } from "../contracts.js";
import { eventsContentSchema } from "../contracts.js";
import type {
  SmartVillageEventOccurrence,
  SmartVillageEventRecord,
  SmartVillageGeoLocation,
} from "../upstream/smart-village-types.js";

const eventSchema = eventsContentSchema.shape.events.shape.results.element;

const nonEmptyString = (value: string | null | undefined): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeTime = (value: string | null | undefined): string | null => {
  const time = nonEmptyString(value);
  if (!time) {
    return null;
  }

  if (/^\d{2}:\d{2}$/.test(time)) {
    return `${time}:00`;
  }

  if (/^\d{2}:\d{2}:\d{2}$/.test(time)) {
    return time;
  }

  return null;
};

const toCoordinates = (value: SmartVillageGeoLocation) => {
  if (!value || value.latitude === null || value.longitude === null) {
    return null;
  }

  return {
    latitude: value.latitude,
    longitude: value.longitude,
  };
};

const toIsoDateTime = (date: string, time: string | null | undefined): string => {
  const normalizedTime = normalizeTime(time) ?? "00:00:00";
  return `${date}T${normalizedTime}.000Z`;
};

export class SmartVillageEventMapper {
  public eventsFromRecord(record: SmartVillageEventRecord): Event[] {
    const occurrences = this.getOccurrences(record);

    return occurrences
      .map((occurrence) => this.eventFromOccurrence(record, occurrence))
      .filter((event): event is Event => event !== null);
  }

  private getOccurrences(record: SmartVillageEventRecord): SmartVillageEventOccurrence[] {
    if (Array.isArray(record.dates) && record.dates.length > 0) {
      return record.dates;
    }

    return record.date ? [record.date] : [];
  }

  private eventFromOccurrence(
    record: SmartVillageEventRecord,
    occurrence: SmartVillageEventOccurrence,
  ): Event | null {
    const title = nonEmptyString(record.title);
    const eventId = nonEmptyString(record.externalId) ?? nonEmptyString(record.id);
    const dateStart = nonEmptyString(occurrence.dateStart);

    if (!title || !eventId || !dateStart) {
      return null;
    }

    const address = record.addresses?.[0];
    const occurrenceId = this.buildOccurrenceId(eventId, dateStart, occurrence.timeStart);
    const coordinates =
      toCoordinates(address?.geoLocation ?? null) ??
      toCoordinates(record.location?.geoLocation ?? null);

    return eventSchema.parse({
      id: occurrenceId,
      eventId,
      terminId: occurrenceId,
      title,
      description: nonEmptyString(record.description) ?? "",
      startDate: toIsoDateTime(dateStart, occurrence.timeStart),
      endDate: this.toEndDate(occurrence),
      location: {
        id: nonEmptyString(record.location?.id) ?? eventId,
        name: nonEmptyString(record.location?.name) ?? title,
        city: nonEmptyString(address?.city),
        street: nonEmptyString(address?.street),
        telephoneNumber: null,
        fax: null,
        email: null,
        website: null,
        zip: nonEmptyString(address?.zip),
      },
      coordinates,
      urls: (record.urls ?? [])
        .map((url) => {
          const link = nonEmptyString(url.url);
          if (!link) {
            return null;
          }

          return {
            link,
            description: nonEmptyString(url.description) ?? "",
          };
        })
        .filter((url): url is { link: string; description: string } => url !== null),
      categories: (record.categories ?? [])
        .map((category) => {
          const id = nonEmptyString(category.id) ?? nonEmptyString(category.name);
          const name = nonEmptyString(category.name) ?? nonEmptyString(category.id);

          if (!id || !name) {
            return null;
          }

          return { id, name };
        })
        .filter((category): category is { id: string; name: string } => category !== null),
      images: (record.mediaContents ?? [])
        .map((mediaContent) => nonEmptyString(mediaContent.sourceUrl?.url))
        .filter((url): url is string => url !== null)
        .map((url) => ({
          thumbnailUrl: url,
          previewUrl: url,
          originalUrl: url,
        })),
      published: record.visible === true,
    });
  }

  private buildOccurrenceId(eventId: string, dateStart: string, timeStart: string | null | undefined) {
    const normalizedTime = nonEmptyString(timeStart) ?? "all-day";
    return `${encodeURIComponent(eventId)}:${encodeURIComponent(dateStart)}:${encodeURIComponent(normalizedTime)}`;
  }

  private toEndDate(occurrence: SmartVillageEventOccurrence): string {
    const dateEnd = nonEmptyString(occurrence.dateEnd) ?? nonEmptyString(occurrence.dateStart);
    if (!dateEnd) {
      return "";
    }

    return toIsoDateTime(
      dateEnd,
      normalizeTime(occurrence.timeEnd) ?? normalizeTime(occurrence.timeStart),
    );
  }
}
