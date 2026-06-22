import type { Coordinates } from "@shared/public-content/contracts";
import type { BookingEvent, EventDetails, Ticket } from "@/stores/eventStore";

type FetchLike = typeof fetch;

const createDocument = (markup: string) => new DOMParser().parseFromString(markup, "text/html");

const readText = (element: ParentNode, selector: string) =>
  element.querySelector(selector)?.textContent?.trim() || "";

const readHtmlBlock = (element: ParentNode, selector: string) => {
  const descriptionElement = element.querySelector(selector);
  if (!descriptionElement) {
    return "";
  }

  let currentElement = descriptionElement.nextElementSibling;
  const paragraphs: string[] = [];

  while (
    currentElement &&
    currentElement.tagName === "P" &&
    !currentElement.classList.length &&
    currentElement.textContent?.trim() !== ""
  ) {
    paragraphs.push(currentElement.outerHTML);
    currentElement = currentElement.nextElementSibling;
  }

  return [descriptionElement.outerHTML, ...paragraphs].join("\n");
};

const parseTicket = (ticketElement: Element): Ticket => ({
  title: readText(ticketElement, "h4"),
  description: readHtmlBlock(ticketElement, ".description"),
  location: readText(ticketElement, ".location"),
  type: readText(ticketElement, ".type"),
  flags: Array.from(ticketElement.querySelectorAll(".flag")).map((flag) => flag.textContent?.trim() || ""),
  autoCommitNote: readText(ticketElement, ".autoCommitBooking"),
  prices: Array.from(ticketElement.querySelectorAll(".price-category-list li")).map((item) => ({
    price: readText(item, ".price-category-item-price"),
    interval: readText(item, ".price-category-interval"),
    category: readText(item, ".price-category"),
  })),
  bookingUrl: ticketElement.querySelector("a.btn-booking")?.getAttribute("href") || "",
  bkid: ticketElement.querySelector("a.btn-detail")?.getAttribute("href") || "",
  imgUrl:
    ticketElement.querySelector("img")?.getAttribute("src") ||
    "/images/guben-city-booking-card-placeholder.png",
});

export const parseBookingEventList = (markup: string): BookingEvent[] => {
  const doc = createDocument(markup);
  const eventElements = doc.querySelectorAll(".event");

  return Array.from(eventElements).map((eventElement) => ({
    title: readText(eventElement, "h3"),
    date: readText(eventElement, ".date"),
    organizer: readText(eventElement, ".organizer-name"),
    contactName: readText(eventElement, ".contact-name"),
    contactPhone: readText(eventElement, ".contact-phone"),
    contactEmail: readText(eventElement, ".contact-email"),
    teaser: readHtmlBlock(eventElement, ".teaser-text"),
    bkid: eventElement.querySelector(".btn-detail")?.getAttribute("href")?.split("bkid=")[1] || "",
    imgUrl: eventElement.querySelector("img")?.getAttribute("src") || "",
    flags: Array.from(eventElement.querySelectorAll(".flags .flag")).map(
      (flag) => flag.textContent?.trim() || "",
    ),
  }));
};

export const parseBookingEventDetail = (markup: string, fallbackImage: string): EventDetails | undefined => {
  const doc = createDocument(markup);
  const eventElement = doc.querySelector(".event");
  const infoElement = eventElement?.querySelector(".information");

  if (!eventElement || !infoElement) {
    return undefined;
  }

  const street = readText(eventElement, ".event-location .street");
  const houseNumber = readText(eventElement, ".event-location .houseNumber");

  return {
    longDescription: readHtmlBlock(infoElement, ".description"),
    eventLocation: readText(eventElement, ".event-location .name"),
    eventLocationEmail: readText(eventElement, ".event-location .email-address"),
    eventOrganizer: readText(eventElement, ".event-organizer .name"),
    agenda: Array.from(eventElement.querySelectorAll(".schedules .schedule-list li")).map(
      (item) => item.textContent?.trim() || "",
    ),
    teaserImage: infoElement.querySelector(".teaser-image")?.getAttribute("src") || fallbackImage,
    street: street ? `${street} ${houseNumber}`.trim() : "",
    houseNumber,
    zip: readText(eventElement, ".event-location .zip"),
    city: readText(eventElement, ".event-location .city"),
    tickets: Array.from(
      eventElement.querySelectorAll(".related-tickets .booking-manager-list li.bt-ticket"),
    ).map(parseTicket),
  };
};

export const fetchPhotonCoordinates = async (
  fetchImpl: FetchLike,
  address: {
    street?: string;
    streetNumber?: string;
    zip?: string;
    city?: string;
  },
): Promise<Coordinates> => {
  try {
    if (!address.street || !address.streetNumber || !address.zip || !address.city) {
      return null;
    }

    const query = `${address.streetNumber} ${address.street}, ${address.zip} ${address.city}`;
    const response = await fetchImpl(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    const coordinates = data.features?.[0]?.geometry?.coordinates;

    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      return null;
    }

    return {
      latitude: coordinates[1],
      longitude: coordinates[0],
    };
  } catch (error) {
    console.error("Photon fetch failed:", error);
    return null;
  }
};

export const enrichBookingEvent = async (
  event: BookingEvent,
  options: {
    tenantId: string;
    bookingBaseUrl: string;
    fetchImpl: FetchLike;
    geocode: (address: {
      street?: string;
      streetNumber?: string;
      zip?: string;
      city?: string;
    }) => Promise<Coordinates>;
  },
): Promise<BookingEvent> => {
  if (!event.bkid) {
    return event;
  }

  try {
    const detailResponse = await options.fetchImpl(
      `${options.bookingBaseUrl}/html/${options.tenantId}/events/${event.bkid}`,
    );
    const detailMarkup = await detailResponse.text();
    const details = parseBookingEventDetail(detailMarkup, event.imgUrl);
    if (!details) {
      return event;
    }

    const street = readText(createDocument(detailMarkup), ".event-location .street");
    const houseNumber = readText(createDocument(detailMarkup), ".event-location .houseNumber");

    return {
      ...event,
      details,
      coordinates: await options.geocode({
        street,
        streetNumber: houseNumber,
        zip: details.zip,
        city: details.city,
      }),
    };
  } catch (error) {
    console.error("Failed to fetch event details for", event.bkid, error);
    return event;
  }
};
