import type { Coordinates } from "@shared/public-content/contracts";
import { useEventStore } from "@/stores/eventStore";
import { useEffect } from "react";
import { trimTrailingSlashes } from "@/utilities/urlUtils";
import { enrichBookingEvent, fetchPhotonCoordinates, parseBookingEventList } from "./eventIntegrationUtils";

export { trimTrailingSlashes } from "@/utilities/urlUtils";

const bookingBaseUrl = trimTrailingSlashes(import.meta.env.VITE_BOOKING_URL || "/api/booking");

type EventIntegrationProps = {
  tenantId: string;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  onDone?: () => void;
};

export default function EventIntegration({ tenantId, setLoading, onDone }: EventIntegrationProps) {
  const addEvent = useEventStore((state) => state.addEvents);

  useEffect(() => {
    const fetchEvents = async () => {
      const url = `${bookingBaseUrl}/html/${tenantId}/events`;
      try {
        const resp = await fetch(url);
        const html = await resp.text();
        const events = parseBookingEventList(html);
        const enrichedEvents = await Promise.all(
          events.map((event) =>
            enrichBookingEvent(event, {
              tenantId,
              bookingBaseUrl,
              fetchImpl: fetch,
              geocode: (address) => fetchPhotonCoordinates(fetch, address),
            }),
          ),
        );

        addEvent(enrichedEvents);
      } catch (error) {
        console.error("Failed to fetch events.", error);
      } finally {
        setLoading(false);
        onDone?.();
      }
    };

    fetchEvents();
  }, [tenantId]);

  return null;
}
