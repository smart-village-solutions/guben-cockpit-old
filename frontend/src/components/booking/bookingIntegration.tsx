import { useEffect } from "react";
import { useBookingStore } from "@/stores/bookingStore";
import { loadPublicBookings } from "@/booking-api/client";
import { trimTrailingSlashes } from "@/utilities/urlUtils";

export { trimTrailingSlashes } from "@/utilities/urlUtils";

type BookingIntegrationProps = {
  tenantId: string;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  onDone?: () => void;
  onError?: (error: unknown) => void;
  privateTenant?: boolean;
};

export default function BookingIntegration({
  tenantId,
  setLoading,
  onDone,
  onError,
  privateTenant = false,
}: BookingIntegrationProps) {
  const addBooking = useBookingStore((state) => state.addBookings);

  useEffect(() => {
    let cancelled = false;

    const fetchBookings = async () => {
      setLoading(true);

      try {
        const bookings = await loadPublicBookings(tenantId, { privateTenant });
        if (!cancelled) {
          addBooking(bookings);
          onDone?.();
        }
      } catch (cause) {
        if (!cancelled) {
          onError?.(cause);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchBookings();

    return () => {
      cancelled = true;
    };
  }, [tenantId, privateTenant, addBooking, onDone, onError, setLoading]);

  return null;
}
