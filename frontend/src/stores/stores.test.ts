import { describe, expect, it } from "vitest";

import { Permissions } from "@/auth/permissions";
import { useBookingStore } from "./bookingStore";
import { useEventStore } from "./eventStore";

describe("stores and permissions", () => {
  it("exposes the expected permission constants", () => {
    expect(Permissions.PublishEvents).toBe("publish_events");
    expect(Object.values(Permissions)).toContain("booking_manager");
  });

  it("deduplicates bookings by bkid or booking URL", () => {
    useBookingStore.setState({
      bookings: [],
      processedTenants: new Set<string>(),
    });

    useBookingStore.getState().addBookings([
      {
        title: "Booking 1",
        description: "A",
        location: "Guben",
        type: "room",
        imgUrl: "/a.jpg",
        bookingUrl: "https://example.com/a",
        price: "10 EUR",
        prices: [],
        category: "room",
        bkid: "bk-1",
      },
      {
        title: "Booking 1 duplicate",
        description: "B",
        location: "Guben",
        type: "room",
        imgUrl: "/b.jpg",
        bookingUrl: "https://example.com/b",
        price: "15 EUR",
        prices: [],
        category: "room",
        bkid: "bk-1",
      },
      {
        title: "Booking 2",
        description: "C",
        location: "Guben",
        type: "room",
        imgUrl: "/c.jpg",
        bookingUrl: "https://example.com/c",
        price: "20 EUR",
        prices: [],
        category: "room",
      },
    ]);
    useBookingStore.getState().markProcessedTenants("tenant-1");

    const state = useBookingStore.getState();
    expect(state.bookings).toHaveLength(2);
    expect(state.bookings[0].title).toBe("Booking 1 duplicate");
    expect(Array.from(state.processedTenants)).toEqual(["tenant-1"]);
  });

  it("deduplicates events and resolves tickets by bkid", () => {
    useEventStore.setState({
      events: [],
      processedTenants: new Set<string>(),
    });

    useEventStore.getState().addEvents([
      {
        title: "Event 1",
        date: "2026-04-10",
        organizer: "Stadt",
        contactName: "Anna",
        contactPhone: "123",
        contactEmail: "anna@example.com",
        teaser: "Teaser",
        bkid: "event-1",
        imgUrl: "/event.jpg",
      },
      {
        title: "Event 1 updated",
        date: "2026-04-10",
        organizer: "Stadt",
        contactName: "Anna",
        contactPhone: "123",
        contactEmail: "anna@example.com",
        teaser: "Teaser",
        bkid: "event-1",
        imgUrl: "/event-updated.jpg",
        details: {
          tickets: [
            {
              title: "Ticket",
              prices: [{ price: "5 EUR" }],
              bookingUrl: "https://example.com/ticket",
              bkid: "ticket-1",
              imgUrl: "/ticket.jpg",
            },
          ],
        },
      },
    ]);
    useEventStore.getState().markProcessedTenants("tenant-2");

    const state = useEventStore.getState();
    expect(state.events).toHaveLength(1);
    expect(state.events[0].title).toBe("Event 1 updated");
    expect(state.getTicketsByBkid("event-1")).toEqual([
      {
        title: "Ticket",
        prices: [{ price: "5 EUR" }],
        bookingUrl: "https://example.com/ticket",
        bkid: "ticket-1",
        imgUrl: "/ticket.jpg",
      },
    ]);
    expect(state.getTicketsByBkid("missing")).toEqual([]);
    expect(Array.from(state.processedTenants)).toEqual(["tenant-2"]);
  });
});
