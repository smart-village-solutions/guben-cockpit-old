import { useCallback, useEffect, useMemo, useState } from "react";

import { loadPublicBookings } from "@/booking-api/client";
import { useGatewayBookingTenants } from "@/public-content/hooks";
import { useBookingStore, type Booking } from "@/stores/bookingStore";

const findBookingByTitle = (bookings: Booking[], title: string) =>
  bookings.find((booking) => booking.title === title) ??
  bookings.flatMap((booking) => booking.bookings || []).find((booking) => booking.title === title);

export const useBookingDetailHydration = (title: string) => {
  const bookings = useBookingStore((state) => state.bookings);
  const processedTenants = useBookingStore((state) => state.processedTenants);
  const addBookings = useBookingStore((state) => state.addBookings);
  const markProcessedTenants = useBookingStore((state) => state.markProcessedTenants);
  const gatewayTenantIdsQuery = useGatewayBookingTenants();

  const [isHydrating, setIsHydrating] = useState(false);
  const [hydrationError, setHydrationError] = useState<unknown>(null);
  const [retryToken, setRetryToken] = useState(0);

  const booking = useMemo(() => findBookingByTitle(bookings, title), [bookings, title]);

  const retry = useCallback(() => {
    setHydrationError(null);
    setRetryToken((token) => token + 1);
    void gatewayTenantIdsQuery.refetch?.();
  }, [gatewayTenantIdsQuery]);

  useEffect(() => {
    if (gatewayTenantIdsQuery.error) {
      setHydrationError(gatewayTenantIdsQuery.error);
      return;
    }

    if (!gatewayTenantIdsQuery.data || booking) {
      return;
    }

    const tenantsToLoad = gatewayTenantIdsQuery.data.tenants.filter(
      (tenant) => retryToken > 0 || !processedTenants.has(tenant.tenantId),
    );

    if (tenantsToLoad.length === 0) {
      return;
    }

    let cancelled = false;

    const hydrateBookings = async () => {
      setIsHydrating(true);

      try {
        let nextBookings = bookings;
        let firstError: unknown = null;

        for (const tenant of tenantsToLoad) {
          if (cancelled) {
            return;
          }

          try {
            const tenantBookings = await loadPublicBookings(tenant.tenantId);

            if (cancelled) {
              return;
            }

            addBookings(tenantBookings);
            markProcessedTenants(tenant.tenantId);
            nextBookings = [...nextBookings, ...tenantBookings];

            if (findBookingByTitle(nextBookings, title)) {
              firstError = null;
              break;
            }
          } catch (error) {
            firstError ??= error;
          }
        }

        if (!cancelled) {
          setHydrationError(firstError);
        }
      } finally {
        if (!cancelled) {
          setIsHydrating(false);
        }
      }
    };

    void hydrateBookings();

    return () => {
      cancelled = true;
    };
  }, [
    addBookings,
    booking,
    gatewayTenantIdsQuery.error,
    gatewayTenantIdsQuery.data,
    gatewayTenantIdsQuery,
    markProcessedTenants,
    retryToken,
    title,
  ]);

  return {
    booking,
    isHydrating: gatewayTenantIdsQuery.isLoading || isHydrating,
    hydrationError: hydrationError ?? gatewayTenantIdsQuery.error,
    retry,
  };
};
