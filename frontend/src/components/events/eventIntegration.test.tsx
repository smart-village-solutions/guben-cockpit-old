import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EventIntegration from "./eventIntegration";
import { useEventStore } from "@/stores/eventStore";

const eventList = `
  <div class="event">
    <h3> Stadtfest </h3><span class="date">31.10.2026</span>
    <span class="organizer-name">Stadt Guben</span>
    <span class="contact-name">Veranstaltungsbüro</span>
    <span class="contact-phone">03561 123</span><span class="contact-email">events@example.org</span>
    <div class="flags"><span class="flag"> Kultur </span></div>
    <img src="/event.jpg" alt="" />
    <p class="teaser-text">Ein Fest für alle.</p><p>Mit Musik.</p>
    <a class="btn-detail" href="/details?bkid=event-1">Details</a>
  </div>`;

const detail = `
  <div class="event">
    <div class="information">
      <p class="description">Programm</p><p>Ab 10 Uhr geöffnet.</p>
      <img class="teaser-image" src="/detail.jpg" alt="" />
    </div>
    <div class="event-location">
      <span class="name">Rathaus</span><span class="street">Markt</span>
      <span class="houseNumber">1</span><span class="zip">03172</span><span class="city">Guben</span>
      <span class="email-address">rathaus@example.org</span>
    </div>
    <div class="event-organizer"><span class="name">Stadt Guben</span></div>
    <div class="schedules"><ul class="schedule-list"><li> Konzert </li></ul></div>
    <div class="related-tickets"><ul class="booking-manager-list">
      <li class="bt-ticket">
        <h4> Familienticket </h4>
        <p class="description">Für die ganze Familie.</p><p>Gültig am Veranstaltungstag.</p>
        <p class="stop">Diesen Absatz nicht zur Beschreibung hinzufügen.</p>
        <span class="location"> Rathaus </span><span class="type"> Eintritt </span>
        <span class="flag"> Kinder willkommen </span><span class="flag"> Barrierefrei </span>
        <span class="autoCommitBooking"> Sofort bestätigt </span>
        <ul class="price-category-list">
          <li><span class="price-category-item-price"> 12 € </span><span class="price-category-interval"> pro Tag </span><span class="price-category"> Familie </span></li>
          <li></li>
        </ul>
        <a class="btn-booking" href="https://booking.example.org/family">Buchen</a>
        <a class="btn-detail" href="/tickets/family">Details</a>
        <img src="/family.jpg" alt="" />
      </li>
      <li class="bt-ticket"></li>
    </ul></div>
  </div>`;

describe("EventIntegration", () => {
  beforeEach(() => {
    useEventStore.setState({ events: [], processedTenants: new Set() });
  });

  it("loads event details and preserves complete and sparse ticket data for booking", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(eventList))
      .mockResolvedValueOnce(new Response(detail))
      .mockResolvedValueOnce(new Response(JSON.stringify({ features: [{ geometry: { coordinates: [14.7143, 51.95042] } }] })));
    const setLoading = vi.fn();
    const onDone = vi.fn();

    render(<EventIntegration tenantId="guben" setLoading={setLoading} onDone={onDone} />);
    await waitFor(() => expect(onDone).toHaveBeenCalledOnce());

    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      expect.stringMatching(/\/html\/guben\/events$/),
      expect.stringMatching(/\/html\/guben\/events\/event-1$/),
      "https://photon.komoot.io/api/?q=1%20Markt%2C%2003172%20Guben",
    ]);
    const event = useEventStore.getState().events[0];
    expect(event).toMatchObject({
      title: "Stadtfest", bkid: "event-1", flags: ["Kultur"],
      coordinates: { latitude: 51.95042, longitude: 14.7143 },
      details: { street: "Markt 1", city: "Guben", agenda: ["Konzert"] },
    });
    const tickets = useEventStore.getState().getTicketsByBkid("event-1");
    expect(tickets).toEqual([
      {
        title: "Familienticket",
        description: '<p class="description">Für die ganze Familie.</p>\n<p>Gültig am Veranstaltungstag.</p>',
        location: "Rathaus", type: "Eintritt", flags: ["Kinder willkommen", "Barrierefrei"],
        autoCommitNote: "Sofort bestätigt",
        prices: [{ price: "12 €", interval: "pro Tag", category: "Familie" }, { price: "", interval: "", category: "" }],
        bookingUrl: "https://booking.example.org/family", bkid: "/tickets/family", imgUrl: "/family.jpg",
      },
      {
        title: "", description: "", location: "", type: "", flags: [], autoCommitNote: "", prices: [],
        bookingUrl: "", bkid: "", imgUrl: "/images/guben-city-booking-card-placeholder.png",
      },
    ]);
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });

  it("finishes loading after a failed detail request and retains the listing event", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(eventList))
      .mockRejectedValueOnce(new Error("Detail service unavailable"));
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const setLoading = vi.fn();
    const onDone = vi.fn();

    render(<EventIntegration tenantId="guben" setLoading={setLoading} onDone={onDone} />);
    await waitFor(() => expect(onDone).toHaveBeenCalledOnce());

    expect(useEventStore.getState().events).toEqual([expect.objectContaining({ bkid: "event-1", title: "Stadtfest" })]);
    expect(useEventStore.getState().getTicketsByBkid("event-1")).toEqual([]);
    expect(errorLog).toHaveBeenCalledWith("Failed to fetch event details for", "event-1", expect.any(Error));
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });
});
