import { bookingFaqsContentSchema } from "../../../shared/public-content/contracts.js";
import type { BookingFaqItem, BookingFaqsContent } from "../../../shared/public-content/contracts.js";
import { GatewayError } from "../errors.js";
import { requestCached, type SmartVillageGraphQLReader } from "../upstream/smart-village-graphql-client.js";
import type { SmartVillageGenericItem } from "../upstream/smart-village-types.js";

const BOOKING_FAQS_QUERY = `
  query SmartVillageBookingFaqs {
    genericItems(genericType: "FAQ") {
      id
      title
      genericType
      payload
      contentBlocks { body }
    }
  }
`;

type Options = {
  client: SmartVillageGraphQLReader;
  warn?: (message: string, context: Record<string, unknown>) => void;
};

type QueryResponse = { genericItems?: SmartVillageGenericItem[] | null };
type FaqPayload = { languageCode: string; sortWeight?: unknown };

const invalidPayloadError = () =>
  new GatewayError({
    code: "INVALID_UPSTREAM_PAYLOAD",
    message: "Smart Village FAQ response did not contain a valid genericItems collection",
    statusCode: 502,
    upstream: "smartvillage",
    retryable: false,
  });

const expectGenericItems = (response: QueryResponse) => {
  if (!Array.isArray(response.genericItems)) throw invalidPayloadError();
  return response.genericItems;
};

const normalizeLanguage = (value: string) => value.trim().slice(0, 2).toLowerCase();

const parsePayload = (value: unknown): FaqPayload | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const payload = value as Record<string, unknown>;
  if (typeof payload.languageCode !== "string" || normalizeLanguage(payload.languageCode).length !== 2) return null;
  return { languageCode: payload.languageCode, sortWeight: payload.sortWeight };
};

const leadingNumber = (title: string) => {
  const match = /^\s*(\d+)\./.exec(title);
  return match ? Number(match[1]) : null;
};

const collator = new Intl.Collator("de", { sensitivity: "base", numeric: false });

export class SmartVillageBookingFaqRepository {
  public constructor(private readonly options: Options) {}

  public async getBookingFaqs(language: string): Promise<BookingFaqsContent> {
    const response = await requestCached(this.options.client, {
      contractId: "booking-faqs.collection.v1",
      query: BOOKING_FAQS_QUERY,
      validate: expectGenericItems,
    });

    const normalizedLanguage = normalizeLanguage(language);
    const items = expectGenericItems(response)
      .flatMap((item) => this.mapItem(item))
      .filter((item) => item.languageCode === normalizedLanguage)
      .sort(this.compareItems);

    return bookingFaqsContentSchema.parse({ items });
  }

  private mapItem(item: SmartVillageGenericItem): BookingFaqItem[] {
    const payload = parsePayload(item.payload);
    const valid =
      typeof item.id === "string" &&
      item.id.length > 0 &&
      typeof item.title === "string" &&
      item.title.trim().length > 0 &&
      item.genericType === "FAQ" &&
      payload !== null &&
      Array.isArray(item.contentBlocks) &&
      item.contentBlocks.length === 1 &&
      typeof item.contentBlocks[0]?.body === "string";

    if (!valid || !payload) {
      this.options.warn?.("Skipping malformed Smart Village FAQ item", {
        itemId: typeof item.id === "string" ? item.id : null,
      });
      return [];
    }

    return [{
      id: item.id as string,
      question: item.title as string,
      answer: item.contentBlocks![0]!.body as string,
      languageCode: normalizeLanguage(payload.languageCode),
      sortWeight: typeof payload.sortWeight === "number" && Number.isFinite(payload.sortWeight) ? payload.sortWeight : 0,
    }];
  }

  private compareItems(left: BookingFaqItem, right: BookingFaqItem) {
    if (left.sortWeight !== right.sortWeight) return right.sortWeight - left.sortWeight;
    const leftNumber = leadingNumber(left.question);
    const rightNumber = leadingNumber(right.question);
    if (leftNumber !== null && rightNumber === null) return -1;
    if (leftNumber === null && rightNumber !== null) return 1;
    if (leftNumber !== null && rightNumber !== null && leftNumber !== rightNumber) return leftNumber - rightNumber;
    const byTitle = collator.compare(left.question, right.question);
    return byTitle || left.id.localeCompare(right.id);
  }
}
