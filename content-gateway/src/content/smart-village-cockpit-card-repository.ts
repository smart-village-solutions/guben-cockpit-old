import type { InformationCard } from "../../../shared/public-content/contracts.js";
import { GatewayError } from "../errors.js";
import { requestCached, type SmartVillageGraphQLReader } from "../upstream/smart-village-graphql-client.js";
import type { SmartVillageGenericItem } from "../upstream/smart-village-types.js";

const COCKPIT_CARDS_QUERY = `
  query SmartVillageCockpitCards {
    genericItems(genericType: "COCKPIT_CARD") {
      id
      title
      genericType
      payload
      contentBlocks { body }
      mediaContents { sourceUrl { url description } }
      webUrls { url description }
      categories { name }
    }
  }
`;

type Options = {
  client: SmartVillageGraphQLReader;
  warn?: (message: string, context: Record<string, unknown>) => void;
};

type QueryResponse = { genericItems?: SmartVillageGenericItem[] | null };
type CockpitCardPayload = {
  languageCode: string;
  sortWeight: number;
  openInNewTab: boolean;
};

export type CategorizedCockpitCard = {
  categoryName: string;
  languageCode: string;
  sortWeight: number;
  card: InformationCard;
};

const normalizeLanguage = (value: string) => value.trim().slice(0, 2).toLowerCase();
const optionalString = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const parsePayload = (value: unknown): CockpitCardPayload | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const payload = value as Record<string, unknown>;
  if (typeof payload.languageCode !== "string" || normalizeLanguage(payload.languageCode).length !== 2) return null;
  return {
    languageCode: normalizeLanguage(payload.languageCode),
    sortWeight:
      typeof payload.sortWeight === "number" && Number.isFinite(payload.sortWeight)
        ? payload.sortWeight
        : 0,
    openInNewTab: payload.openInNewTab === true,
  };
};

const invalidPayloadError = () =>
  new GatewayError({
    code: "INVALID_UPSTREAM_PAYLOAD",
    message: "Smart Village Cockpit Card response did not contain a valid genericItems collection",
    statusCode: 502,
    upstream: "smartvillage",
    retryable: false,
  });

const expectGenericItems = (response: QueryResponse) => {
  if (!Array.isArray(response.genericItems)) throw invalidPayloadError();
  return response.genericItems;
};

export class SmartVillageCockpitCardRepository {
  public constructor(private readonly options: Options) {}

  public async getCockpitCards(language: string): Promise<CategorizedCockpitCard[]> {
    const response = await requestCached(this.options.client, {
      contractId: "cockpit-cards.collection.v1",
      query: COCKPIT_CARDS_QUERY,
      validate: expectGenericItems,
    });

    const normalizedLanguage = normalizeLanguage(language);
    return expectGenericItems(response)
      .flatMap((item) => this.mapItem(item))
      .filter((item) => item.languageCode === normalizedLanguage)
      .sort((left, right) => left.sortWeight - right.sortWeight || left.card.id.localeCompare(right.card.id));
  }

  private mapItem(item: SmartVillageGenericItem): CategorizedCockpitCard[] {
    const payload = parsePayload(item.payload);
    const id = optionalString(item.id);
    const title = optionalString(item.title);
    const categories = item.categories;
    const categoryName = Array.isArray(categories) && categories.length === 1
      ? optionalString(categories[0]?.name)
      : null;

    if (!id || !title || item.genericType !== "COCKPIT_CARD" || !payload || !categoryName) {
      this.options.warn?.("Skipping malformed Smart Village Cockpit Card", { itemId: id });
      return [];
    }

    const description = optionalString(item.contentBlocks?.[0]?.body);
    const imageUrl = optionalString(item.mediaContents?.[0]?.sourceUrl?.url);
    const imageAlt = optionalString(item.mediaContents?.[0]?.sourceUrl?.description);
    const buttonUrl = optionalString(item.webUrls?.[0]?.url);
    const buttonTitle = optionalString(item.webUrls?.[0]?.description) ?? "Mehr erfahren";

    return [{
      categoryName,
      languageCode: payload.languageCode,
      sortWeight: payload.sortWeight,
      card: {
        id,
        title,
        description,
        imageUrl,
        imageAlt,
        button: buttonUrl
          ? { title: buttonTitle, url: buttonUrl, openInNewTab: payload.openInNewTab }
          : null,
      },
    }];
  }
}
