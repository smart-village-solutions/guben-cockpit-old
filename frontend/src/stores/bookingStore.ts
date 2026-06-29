import { create } from "zustand"

export type BookingPrice = {
  price: string;
  interval?: string;
  category?: string;
};

export type BookingAttachment = {
  title: string;
  url: string;
  type?: string;
};

export type BookingAvailability = {
  bookableId: string;
  title: string;
  isAvailable: boolean;
  totalCapacity: number | null;
  booked: number | null;
  remaining: number | null;
};

export type Ticket = {
  tenantId: string;
  title: string;
  description: string;
  location: string;
  type: string;
  flags?: string[];
  autoCommitNote?: string;
  price?: string;
  prices: BookingPrice[];
  bookingUrl: string;
  bkid: string;
  imgUrl: string;
};

export type Booking = {
  tenantId: string;
  title: string;
  description: string;
  location: string;
  type: string;
  imgUrl: string;
  bookingUrl: string;
  price: string;
  prices: BookingPrice[];
  category: string;
  flags?: string[];
  bkid?: string;
  autoCommitNote?: string;
  tickets?: Ticket[];
  bookings?: Booking[];
  requiresLogin?: boolean;
  isBookable?: boolean;
  attachments?: BookingAttachment[];
};

type BookingStore = {
  bookings: Booking[];
  processedTenants: Set<string>;
  setBookings: (bookings: Booking[]) => void;
  addBookings: (bookings: Booking[]) => void;
  markProcessedTenants: (tenantId: string) => void;
  reset: () => void;
}

export const useBookingStore = create<BookingStore>((set) => ({
  processedTenants: new Set<string>(),
  markProcessedTenants: (tenantId) => 
    set((state) => ({
      processedTenants: new Set([...state.processedTenants, tenantId]),
    })),
  bookings: [],
  setBookings: (bookings) => set(() => ({ bookings })),
  addBookings: (newBookings) =>
    set((state) => {
      const all = [...state.bookings, ...newBookings];

      const unique = Array.from(
        new Map(all.map((b) => [b.bkid ?? b.bookingUrl, b])).values()
      );

      return { bookings: unique };
    }),
  reset: () =>
    set(() => ({
      bookings: [],
      processedTenants: new Set<string>(),
    })),
}));
