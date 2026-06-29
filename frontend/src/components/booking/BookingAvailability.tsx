import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { loadBookableOccupancy } from "@/booking-api/client";
import type { BookingAvailability as BookingAvailabilityModel } from "@/stores/bookingStore";
import { BookingErrorState } from "./BookingErrorState";

type BookingAvailabilityProps = {
  tenantId?: string;
  bookableId?: string;
};

const buildOccupancyWindow = () => {
  const start = Date.now();
  const end = start + 24 * 60 * 60 * 1000;
  return {
    timeBegin: start,
    timeEnd: end,
  };
};

export default function BookingAvailability({ tenantId, bookableId }: BookingAvailabilityProps) {
  const { t } = useTranslation("booking");
  const [availability, setAvailability] = useState<BookingAvailabilityModel | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  const searchParams = useMemo(() => buildOccupancyWindow(), []);

  useEffect(() => {
    if (!tenantId || !bookableId) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const nextAvailability = await loadBookableOccupancy(tenantId, bookableId, searchParams);
        if (!cancelled) {
          setAvailability(nextAvailability);
        }
      } catch (cause) {
        if (!cancelled) {
          setAvailability(null);
          setError(cause);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [tenantId, bookableId, retryToken, searchParams]);

  if (!tenantId || !bookableId) {
    return null;
  }

  if (error) {
    return (
      <BookingErrorState
        error={error}
        scope="availability"
        onRetry={() => setRetryToken((value) => value + 1)}
      />
    );
  }

  if (loading) {
    return <p className="text-sm text-white/90">{t("availability.loading")}</p>;
  }

  if (!availability) {
    return null;
  }

  return (
    <div className="space-y-1 text-sm">
      <p>
        {t("availability.label")}:{" "}
        {availability.isAvailable ? t("availability.available") : t("availability.unavailable")}
      </p>
      {availability.remaining !== null ? (
        <p>{t("availability.remaining", { count: availability.remaining })}</p>
      ) : null}
      {availability.totalCapacity !== null ? (
        <p>{t("availability.capacity", { count: availability.totalCapacity })}</p>
      ) : null}
    </div>
  );
}
