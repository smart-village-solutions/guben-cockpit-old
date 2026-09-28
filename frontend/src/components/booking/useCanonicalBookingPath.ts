import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { Booking } from "@/stores/bookingStore";
import { bookingPath, bookingSegment } from "./bookingPath";

export const useCanonicalBookingPath = (
  booking: Booking | undefined,
  segment: string,
  isRoom = false,
) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (booking && segment !== bookingSegment(booking)) {
      void navigate({ to: bookingPath(booking, isRoom), replace: true });
    }
  }, [booking, isRoom, navigate, segment]);
};
