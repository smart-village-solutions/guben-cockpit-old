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

const toHttpUrl = (value: string | null | undefined): string | null => {
  const url = nonEmptyString(value);
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
};

const toEmail = (value: string | null | undefined): string | null => {
  const email = nonEmptyString(value);
  return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
};

const toPhone = (value: string | null | undefined): string | null => {
  const phone = nonEmptyString(value);
  return phone && /^[0-9+().\s/-]+$/.test(phone) ? phone : null;
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

const normalizeOccurrenceIdTime = (value: string | null | undefined): string | null => {
  const normalizedTime = normalizeTime(value);
  if (!normalizedTime) {
    return null;
  }

  return normalizedTime.endsWith(":00") ? normalizedTime.slice(0, 5) : normalizedTime;
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

const toLocalDateTime = (date: string, time: string | null | undefined): string => {
  const normalizedTime = normalizeTime(time) ?? "00:00:00";
  return `${date}T${normalizedTime}`;
};

const toPriceAmount = (value: number | null | undefined): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const toMaximumAttendees = (value: number | null | undefined): number | null =>
  typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;

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
    const internalId = nonEmptyString(record.id);
    const eventId = nonEmptyString(record.externalId) ?? internalId;
    const dateStart = nonEmptyString(occurrence.dateStart);

    if (!title || !internalId || !eventId || !dateStart) {
      return null;
    }

    const address = record.addresses?.[0];
    const occurrenceId = this.buildOccurrenceId(internalId, dateStart, occurrence.timeStart);
    const coordinates =
      toCoordinates(address?.geoLocation ?? null) ??
      toCoordinates(record.location?.geoLocation ?? null);
    const contact = (record.contacts ?? [])
      .map((entry) => ({
        email: toEmail(entry.email),
        phone: toPhone(entry.phone),
        website: entry.webUrls
          ?.map((url) => toHttpUrl(url.url))
          .find((url): url is string => url !== null) ?? null,
      }))
      .find((entry) => entry.email || entry.phone || entry.website) ?? null;
    const priceInformations = (record.priceInformations ?? [])
      .map((price) => ({
        name: nonEmptyString(price.name),
        description: nonEmptyString(price.description),
        amount: toPriceAmount(price.amount),
      }))
      .filter((price) => price.name || price.description || price.amount !== null);
    const organizerName = nonEmptyString(record.organizer?.name);
    const dataProviderName = nonEmptyString(record.dataProvider?.name);
    const maximumAttendees = toMaximumAttendees(record.maximumAttendees);

    return eventSchema.parse({
      id: occurrenceId,
      eventId,
      terminId: occurrenceId,
      title,
      description: nonEmptyString(record.description) ?? "",
      startDate: toLocalDateTime(dateStart, occurrence.timeStart),
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
          const link = toHttpUrl(url.url);
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
      ...(typeof record.registrationRequired === "boolean"
        ? { registrationRequired: record.registrationRequired }
        : {}),
      ...(maximumAttendees !== null ? { maximumAttendees } : {}),
      ...(organizerName ? { organizerName } : {}),
      ...(contact ? { contact } : {}),
      ...(priceInformations.length > 0 ? { priceInformations } : {}),
      ...(dataProviderName ? { dataProviderName } : {}),
      published: record.visible === true,
    });
  }

  private buildOccurrenceId(eventId: string, dateStart: string, timeStart: string | null | undefined) {
    const normalizedTime = normalizeOccurrenceIdTime(timeStart) ?? "all-day";
    return `${encodeURIComponent(eventId)}:${encodeURIComponent(dateStart)}:${encodeURIComponent(normalizedTime)}`;
  }

  private toEndDate(occurrence: SmartVillageEventOccurrence): string {
    const dateEnd = nonEmptyString(occurrence.dateEnd) ?? nonEmptyString(occurrence.dateStart);
    if (!dateEnd) {
      return "";
    }

    return toLocalDateTime(
      dateEnd,
      normalizeTime(occurrence.timeEnd) ?? normalizeTime(occurrence.timeStart),
    );
  }
}
