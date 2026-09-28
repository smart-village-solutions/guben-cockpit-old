import { describe, expect, it } from "vitest";
import type { Booking } from "@/stores/bookingStore";
import { bookingPath, findBookingBySegment } from "./bookingPath";

const booking = (title: string, bkid: string) => ({ title, bkid }) as Booking;

describe("booking paths", () => {
  it("creates a stable, readable URL even when the source title has trailing whitespace", () => {
    const offer = booking("Alte Färberei ", "d5a9474a-62e9-4ac0-ae28-f9a02552a748");

    expect(bookingPath(offer)).toBe(
      "/booking/alte-faerberei--d5a9474a-62e9-4ac0-ae28-f9a02552a748",
    );
    expect(bookingPath(offer, true)).toBe(
      "/booking/room/alte-faerberei--d5a9474a-62e9-4ac0-ae28-f9a02552a748",
    );
  });

  it("resolves old title links and new ID links after a title change", () => {
    const offer = booking("Alte Färberei ", "offer-1");
    const renamed = booking("Neue Färberei", "offer-1");

    expect(findBookingBySegment([offer], "Alte Färberei")).toBe(offer);
    expect(findBookingBySegment([offer], "alte-faerberei")).toBe(offer);
    expect(findBookingBySegment([renamed], "alte-faerberei--offer-1")).toBe(renamed);
  });

  it("uses IDs to distinguish offers with the same title", () => {
    const first = booking("Saal", "room-1");
    const second = booking("Saal", "room-2");

    expect(findBookingBySegment([first, second], "saal--room-2")).toBe(second);
  });
});
