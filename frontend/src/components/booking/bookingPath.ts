import type { Booking } from "@/stores/bookingStore";

const slugify = (title: string) =>
  title
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const bookingSegment = (booking: Booking) => {
  const slug = slugify(booking.title) || "angebot";
  return booking.bkid ? `${slug}--${encodeURIComponent(booking.bkid)}` : slug;
};

export const bookingPath = (booking: Booking, isRoom = false) =>
  `/booking/${isRoom ? "room/" : ""}${bookingSegment(booking)}`;

export const findBookingBySegment = (bookings: Booking[], segment: string) => {
  const allBookings = bookings.flatMap((booking) => [booking, ...(booking.bookings || [])]);
  const id = segment.slice(segment.lastIndexOf("--") + 2);

  return (
    (segment.includes("--") && allBookings.find((booking) => booking.bkid === id)) ||
    allBookings.find((booking) => booking.title.trim() === segment.trim()) ||
    allBookings.find((booking) => bookingSegment(booking) === segment || slugify(booking.title) === segment)
  );
};
