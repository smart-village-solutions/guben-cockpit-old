import { describe, expect, it, vi } from "vitest";

import type { BookingEvent } from "@/stores/eventStore";

import {
  enrichBookingEvent,
  parseBookingEventList,
  parseBookingEventDetail,
  fetchPhotonCoordinates,
} from "./eventIntegrationUtils";

const listMarkup = `
  <div>
    <article class="event">
      <h3>Sommerfest</h3>
      <div class="date">13.06.2026 15:00 - 19:00</div>
      <div class="organizer-name">Stadt Guben</div>
      <div class="contact-name">Max Mustermann</div>
      <div class="contact-phone">12345</div>
      <div class="contact-email">team@example.com</div>
      <div class="flags"><span class="flag">Markt</span><span class="flag">Familie</span></div>
      <img src="/event.jpg" />
      <p class="teaser-text">Teaser</p>
      <p>Mehr Text</p>
      <a class="btn-detail" href="/detail?bkid=event-1">Mehr</a>
    </article>
  </div>
`;

const detailMarkup = `
  <article class="event">
    <div class="information">
      <p class="description">Beschreibung</p>
      <p>Mehr Details</p>
      <img class="teaser-image" src="/detail.jpg" />
    </div>
    <div class="event-location">
      <span class="name">Altstadt</span>
      <span class="email-address">ort@example.com</span>
      <span class="street">Markt</span>
      <span class="houseNumber">1</span>
      <span class="zip">03172</span>
      <span class="city">Guben</span>
    </div>
    <div class="event-organizer"><span class="name">Kulturamt</span></div>
    <div class="schedules"><ul class="schedule-list"><li>18:00 Einlass</li></ul></div>
    <div class="related-tickets">
      <ul class="booking-manager-list">
        <li class="bt-ticket">
          <h4>Ticket A</h4>
          <p class="description">Ticketbeschreibung</p>
          <p>Mehr Tickettext</p>
          <span class="location">Saal</span>
          <span class="type">Erwachsene</span>
          <span class="flag">Abend</span>
          <span class="autoCommitBooking">Hinweis</span>
          <ul class="price-category-list">
            <li>
              <span class="price-category-item-price">10 EUR</span>
              <span class="price-category-interval">pro Person</span>
              <span class="price-category">Standard</span>
            </li>
          </ul>
          <a class="btn-booking" href="/book"></a>
          <a class="btn-detail" href="/ticket-detail"></a>
          <img src="/ticket.jpg" />
        </li>
      </ul>
    </div>
  </article>
`;

describe("eventIntegrationUtils", () => {
  it("parses booking event list markup into store events", () => {
    const events = parseBookingEventList(listMarkup);

    expect(events).toEqual<BookingEvent[]>([
      {
        title: "Sommerfest",
        date: "13.06.2026 15:00 - 19:00",
        organizer: "Stadt Guben",
        contactName: "Max Mustermann",
        contactPhone: "12345",
        contactEmail: "team@example.com",
        teaser: '<p class="teaser-text">Teaser</p>\n<p>Mehr Text</p>',
        bkid: "event-1",
        imgUrl: "/event.jpg",
        flags: ["Markt", "Familie"],
      },
    ]);
  });

  it("parses booking event detail markup into details and tickets", () => {
    const detail = parseBookingEventDetail(detailMarkup, "/fallback.jpg");

    expect(detail).toEqual({
      longDescription: '<p class="description">Beschreibung</p>\n<p>Mehr Details</p>',
      eventLocation: "Altstadt",
      eventLocationEmail: "ort@example.com",
      eventOrganizer: "Kulturamt",
      agenda: ["18:00 Einlass"],
      teaserImage: "/detail.jpg",
      street: "Markt 1",
      houseNumber: "1",
      zip: "03172",
      city: "Guben",
      tickets: [
        {
          title: "Ticket A",
          description: '<p class="description">Ticketbeschreibung</p>\n<p>Mehr Tickettext</p>',
          location: "Saal",
          type: "Erwachsene",
          flags: ["Abend"],
          autoCommitNote: "Hinweis",
          prices: [
            {
              price: "10 EUR",
              interval: "pro Person",
              category: "Standard",
            },
          ],
          bookingUrl: "/book",
          bkid: "/ticket-detail",
          imgUrl: "/ticket.jpg",
        },
      ],
    });
  });

  it("fetches photon coordinates when a result exists", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        features: [
          {
            geometry: {
              coordinates: [14.7143, 51.95042],
            },
          },
        ],
      }),
    });

    const coordinates = await fetchPhotonCoordinates(fetchMock, {
      street: "Markt",
      streetNumber: "1",
      zip: "03172",
      city: "Guben",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://photon.komoot.io/api/?q=1%20Markt%2C%2003172%20Guben",
    );
    expect(coordinates).toEqual({
      latitude: 51.95042,
      longitude: 14.7143,
    });
  });

  it("enriches a booking event with parsed detail and coordinates", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      text: async () => detailMarkup,
    });
    const geocoder = vi.fn().mockResolvedValue({
      latitude: 51.95042,
      longitude: 14.7143,
    });

    const enriched = await enrichBookingEvent(
      {
        title: "Sommerfest",
        date: "13.06.2026 15:00 - 19:00",
        organizer: "Stadt Guben",
        contactName: "Max Mustermann",
        contactPhone: "12345",
        contactEmail: "team@example.com",
        teaser: "<p>Teaser</p>",
        bkid: "event-1",
        imgUrl: "/event.jpg",
        flags: ["Markt"],
      },
      {
        tenantId: "tenant-1",
        bookingBaseUrl: "https://booking.example.com",
        fetchImpl: fetchMock,
        geocode: geocoder,
      },
    );

    expect(fetchMock).toHaveBeenCalledWith("https://booking.example.com/html/tenant-1/events/event-1");
    expect(geocoder).toHaveBeenCalledWith({
      street: "Markt",
      streetNumber: "1",
      zip: "03172",
      city: "Guben",
    });
    expect(enriched.details?.eventLocation).toBe("Altstadt");
    expect(enriched.coordinates).toEqual({
      latitude: 51.95042,
      longitude: 14.7143,
    });
  });
});
