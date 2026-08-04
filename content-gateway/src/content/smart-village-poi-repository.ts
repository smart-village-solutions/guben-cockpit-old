import {
  poiDetailContentSchema,
  poisContentSchema,
  type Poi,
  type PoiDetailContent,
  type PoiFilters,
  type PoisContent,
} from "../../../shared/public-content/contracts.js";
import { GatewayError } from "../errors.js";
import { requestCached, type SmartVillageGraphQLReader } from "../upstream/smart-village-graphql-client.js";
import { TTLCache } from "../upstream/ttl-cache.js";
import { distanceInKm } from "./postgrest-content-mapper.js";

const DEFAULT_CACHE_TTL_MS = 60_000;
const GUBEN_COORDINATES = { latitude: 51.95042, longitude: 14.7143 } as const;

const POI_FIELDS = `
  id
  externalId
  name
  description
  mobileDescription
  active
  visible
  updatedAt
  categories {
    id
    name
    parent { id name }
  }
  addresses {
    street
    addition
    zip
    city
    geoLocation { latitude longitude }
  }
  location {
    name
    geoLocation { latitude longitude }
  }
  contact {
    firstName
    lastName
    email
    phone
    fax
    webUrls { url description }
  }
  mediaContents {
    captionText
    copyright
    sourceUrl { url description }
  }
  webUrls { url description }
  openingHours {
    weekday
    timeFrom
    timeTo
    description
    open
    sortNumber
  }
  operatingCompany { name }
  dataProvider { name }
`;

export const POINTS_OF_INTEREST_QUERY = `
  query SmartVillagePointsOfInterest {
    pointsOfInterest {
      ${POI_FIELDS}
    }
  }
`;

export const POINT_OF_INTEREST_QUERY = `
  query SmartVillagePointOfInterest($id: ID!) {
    pointOfInterest(id: $id) {
      ${POI_FIELDS}
    }
  }
`;

type OptionalString = string | null | undefined;
type GeoLocation = { latitude?: number | null; longitude?: number | null } | null;
type SmartVillagePoi = {
  id?: OptionalString;
  externalId?: OptionalString;
  name?: OptionalString;
  description?: OptionalString;
  mobileDescription?: OptionalString;
  active?: boolean | null;
  visible?: boolean | null;
  updatedAt?: OptionalString;
  categories?: Array<{
    id?: OptionalString;
    name?: OptionalString;
    parent?: { id?: OptionalString; name?: OptionalString } | null;
  }> | null;
  addresses?: Array<{
    street?: OptionalString;
    addition?: OptionalString;
    zip?: OptionalString;
    city?: OptionalString;
    geoLocation?: GeoLocation;
  }> | null;
  location?: { name?: OptionalString; geoLocation?: GeoLocation } | null;
  contact?: {
    firstName?: OptionalString;
    lastName?: OptionalString;
    email?: OptionalString;
    phone?: OptionalString;
    fax?: OptionalString;
    webUrls?: Array<{ url?: OptionalString; description?: OptionalString }> | null;
  } | null;
  mediaContents?: Array<{
    captionText?: OptionalString;
    copyright?: OptionalString;
    sourceUrl?: { url?: OptionalString; description?: OptionalString } | null;
  }> | null;
  webUrls?: Array<{ url?: OptionalString; description?: OptionalString }> | null;
  openingHours?: Array<{
    weekday?: OptionalString;
    timeFrom?: OptionalString;
    timeTo?: OptionalString;
    description?: OptionalString;
    open?: boolean | null;
    sortNumber?: number | null;
  }> | null;
  operatingCompany?: { name?: OptionalString } | null;
  dataProvider?: { name?: OptionalString } | null;
};

type PoiRepositoryOptions = {
  client: SmartVillageGraphQLReader;
  publicBaseUrl: string;
  warn?: (message: string, context: Record<string, unknown>) => void;
  cacheTtlMs?: number;
  now?: () => number;
};

const nonEmpty = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const httpUrl = (value: unknown): string | null => {
  const candidate = nonEmpty(value);
  if (!candidate) return null;
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
};

const normalizeLocation = (value: string) =>
  value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("de");

const coordinatesFrom = (geoLocation: GeoLocation) => {
  const latitude = geoLocation?.latitude;
  const longitude = geoLocation?.longitude;
  return typeof latitude === "number" && Number.isFinite(latitude) &&
    typeof longitude === "number" && Number.isFinite(longitude)
    ? { latitude, longitude }
    : null;
};

export const toPublicPoiId = (id: string) => `poi:${encodeURIComponent(id)}`;

export const fromPublicPoiId = (id: string) => {
  if (!id.startsWith("poi:")) return null;
  try {
    const decoded = decodeURIComponent(id.slice(4));
    return decoded.length > 0 ? decoded : null;
  } catch {
    return null;
  }
};

const notFoundError = () => new GatewayError({
  code: "NOT_FOUND",
  message: "Requested POI was not found",
  statusCode: 404,
  upstream: "gateway",
  retryable: false,
});

const invalidCollectionError = () => new GatewayError({
  code: "INVALID_UPSTREAM_PAYLOAD",
  message: "smartvillage pointsOfInterest response did not include an array",
  statusCode: 502,
  upstream: "smartvillage",
  retryable: false,
});

export class SmartVillagePoiRepository {
  private readonly listCache: TTLCache<string, Poi[]>;
  private readonly detailCache: TTLCache<string, PoiDetailContent>;

  public constructor(private readonly options: PoiRepositoryOptions) {
    const cacheOptions = { ttlMs: options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS, now: options.now };
    this.listCache = new TTLCache(cacheOptions);
    this.detailCache = new TTLCache(cacheOptions);
  }

  public async getPois(_language: string, filters: PoiFilters): Promise<PoisContent> {
    const all = await this.listCache.getOrLoad("all", async () => {
      const response = await requestCached(this.options.client, {
        contractId: "pois.collection.v1",
        query: POINTS_OF_INTEREST_QUERY,
        validate: (value: { pointsOfInterest?: SmartVillagePoi[] | null }) => {
          if (!Array.isArray(value.pointsOfInterest)) throw invalidCollectionError();
        },
      });
      if (!Array.isArray(response.pointsOfInterest)) throw invalidCollectionError();
      return response.pointsOfInterest.flatMap((record) => {
        const poi = this.mapPoi(record);
        if (poi) return [poi];
        this.options.warn?.("Skipped malformed or non-public Smart Village POI", {
          id: nonEmpty(record.id),
          externalId: nonEmpty(record.externalId),
          name: nonEmpty(record.name),
          active: record.active ?? null,
          visible: record.visible ?? null,
        });
        return [];
      });
    });

    const categories = Array.from(
      new Map(all.flatMap((poi) => poi.categories).map((category) => [category.id, category])).values(),
    ).sort((left, right) => left.name.localeCompare(right.name, "de") || left.id.localeCompare(right.id));
    const locations = Array.from(
      new Map(all.flatMap((poi) => poi.locationValue && poi.locationLabel ? [[poi.locationValue, poi.locationLabel] as const] : [])).entries(),
    ).map(([value, label]) => ({ value, label }))
      .sort((left, right) => left.label.localeCompare(right.label, "de") || left.value.localeCompare(right.value));

    let filtered = all;
    const search = nonEmpty(filters.search)?.toLocaleLowerCase("de");
    if (search) {
      filtered = filtered.filter((poi) => `${poi.title}\n${poi.description}`.toLocaleLowerCase("de").includes(search));
    }
    if (filters.categoryIds.length > 0) {
      const selected = new Set(filters.categoryIds);
      filtered = filtered.filter((poi) => poi.categories.some((category) => selected.has(category.id)));
    }
    if (filters.location) {
      filtered = filtered.filter((poi) => poi.locationValue === filters.location);
    }
    if (filters.radius && filters.radius > 0) {
      filtered = filtered.filter((poi) => poi.coordinates !== null && distanceInKm(
        GUBEN_COORDINATES.latitude,
        GUBEN_COORDINATES.longitude,
        poi.coordinates.latitude,
        poi.coordinates.longitude,
      ) <= filters.radius!);
    }
    const direction = filters.direction === "desc" ? -1 : 1;
    filtered = [...filtered].sort((left, right) => {
      const primary = filters.sort === "updatedAt"
        ? (Date.parse(left.updatedAt ?? "") || 0) - (Date.parse(right.updatedAt ?? "") || 0)
        : left.title.localeCompare(right.title, "de");
      return direction * primary || left.id.localeCompare(right.id);
    });

    const pageCount = Math.max(1, Math.ceil(filtered.length / filters.pageSize));
    const pageNumber = Math.min(filters.pageNumber, pageCount);
    const start = (pageNumber - 1) * filters.pageSize;
    return poisContentSchema.parse({
      pageNumber,
      pageSize: filters.pageSize,
      totalCount: filtered.length,
      pageCount,
      results: filtered.slice(start, start + filters.pageSize),
      categories,
      locations,
    });
  }

  public async getPoiById(_language: string, publicId: string): Promise<PoiDetailContent> {
    const internalId = fromPublicPoiId(publicId);
    if (!internalId) throw notFoundError();
    return this.detailCache.getOrLoad(internalId, async () => {
      const response = await requestCached(this.options.client, {
        contractId: "pois.detail.v1",
        query: POINT_OF_INTEREST_QUERY,
        variables: { id: internalId },
        validate: (value: { pointOfInterest?: SmartVillagePoi | null }) => {
          if (!Object.hasOwn(value, "pointOfInterest")) {
            throw new GatewayError({
              code: "INVALID_UPSTREAM_PAYLOAD",
              message: "smartvillage pointOfInterest response did not include pointOfInterest",
              statusCode: 502,
              upstream: "smartvillage",
              retryable: false,
            });
          }
        },
      });
      const poi = response.pointOfInterest ? this.mapPoi(response.pointOfInterest) : null;
      if (!poi) throw notFoundError();
      return poiDetailContentSchema.parse({
        poi,
        seo: {
          title: poi.title,
          description: poi.description || poi.title,
          canonical: new URL(`/projects/${encodeURIComponent(poi.id)}`, this.options.publicBaseUrl).toString(),
          indexable: true,
        },
      });
    });
  }

  private mapPoi(record: SmartVillagePoi): Poi | null {
    const internalId = nonEmpty(record.id);
    const title = nonEmpty(record.name);
    if (!internalId || !title || record.active !== true || record.visible !== true) return null;

    const categories = Array.from(new Map((record.categories ?? []).flatMap((category) => {
      const id = nonEmpty(category.id);
      const name = nonEmpty(category.name);
      return id && name ? [[id, {
        id,
        name,
        parentId: nonEmpty(category.parent?.id),
        parentName: nonEmpty(category.parent?.name),
      }] as const] : [];
    })).values());

    const addressRecord = (record.addresses ?? []).find((address) =>
      [address.street, address.addition, address.zip, address.city].some(nonEmpty),
    ) ?? null;
    const locationLabel = nonEmpty(record.location?.name) ??
      (record.addresses ?? []).map((address) => nonEmpty(address.city)).find(Boolean) ?? null;
    const coordinates = coordinatesFrom(record.location?.geoLocation ?? null) ??
      (record.addresses ?? []).map((address) => coordinatesFrom(address.geoLocation ?? null)).find(Boolean) ?? null;

    const media = Array.from(new Map((record.mediaContents ?? []).flatMap((item) => {
      const url = httpUrl(item.sourceUrl?.url);
      return url ? [[url, {
        url,
        description: nonEmpty(item.captionText) ?? nonEmpty(item.sourceUrl?.description),
        copyright: nonEmpty(item.copyright),
      }] as const] : [];
    })).values());

    const webUrls = Array.from(new Map([
      ...(record.webUrls ?? []),
      ...(record.contact?.webUrls ?? []),
    ].flatMap((item) => {
      const url = httpUrl(item.url);
      return url ? [[url, { url, description: nonEmpty(item.description) }] as const] : [];
    })).values());

    const contactValues = {
      firstName: nonEmpty(record.contact?.firstName),
      lastName: nonEmpty(record.contact?.lastName),
      email: nonEmpty(record.contact?.email),
      phone: nonEmpty(record.contact?.phone),
      fax: nonEmpty(record.contact?.fax),
    };

    return {
      id: toPublicPoiId(internalId),
      title,
      description: nonEmpty(record.description) ?? nonEmpty(record.mobileDescription) ?? "",
      imageUrl: media[0]?.url ?? null,
      updatedAt: nonEmpty(record.updatedAt),
      categories,
      locationValue: locationLabel ? normalizeLocation(locationLabel) : null,
      locationLabel,
      coordinates,
      media,
      address: addressRecord ? {
        street: nonEmpty(addressRecord.street),
        addition: nonEmpty(addressRecord.addition),
        zip: nonEmpty(addressRecord.zip),
        city: nonEmpty(addressRecord.city),
      } : null,
      contact: Object.values(contactValues).some(Boolean) ? contactValues : null,
      webUrls,
      openingHours: (record.openingHours ?? []).map((item) => ({
        weekday: nonEmpty(item.weekday),
        timeFrom: nonEmpty(item.timeFrom),
        timeTo: nonEmpty(item.timeTo),
        description: nonEmpty(item.description),
        open: typeof item.open === "boolean" ? item.open : null,
        sortNumber: typeof item.sortNumber === "number" && Number.isFinite(item.sortNumber) ? item.sortNumber : null,
      })).sort((left, right) => (left.sortNumber ?? Number.MAX_SAFE_INTEGER) - (right.sortNumber ?? Number.MAX_SAFE_INTEGER)),
      operatingCompany: nonEmpty(record.operatingCompany?.name),
      dataProvider: nonEmpty(record.dataProvider?.name),
    };
  }
}
