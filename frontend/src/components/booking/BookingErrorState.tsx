import { AlertTriangleIcon, RefreshCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingApiError, isBookingApiError } from "@/booking-api/errors";

type BookingErrorStateProps = {
  error: unknown;
  onRetry?: () => void;
  scope?: "overview" | "detail" | "availability";
};

const codeLabel: Record<BookingApiError["code"], string> = {
  BOOKING_API_CONFIG_ERROR: "Die Buchungsplattform ist fuer diese Auslieferung nicht korrekt konfiguriert.",
  BOOKING_API_TRANSPORT_ERROR: "Die Buchungsplattform ist aktuell nicht erreichbar.",
  BOOKING_API_HTTP_ERROR: "Die Buchungsplattform antwortet aktuell mit einem Fehler.",
  BOOKING_API_INVALID_PAYLOAD: "Die Buchungsdaten sind aktuell unvollstaendig oder fehlerhaft.",
};

const titleLabel: Record<NonNullable<BookingErrorStateProps["scope"]>, string> = {
  overview: "Buchungen aktuell nicht verfuegbar",
  detail: "Buchungsdetails aktuell nicht verfuegbar",
  availability: "Verfuegbarkeit aktuell nicht verfuegbar",
};

export const BookingErrorState = ({
  error,
  onRetry,
  scope = "overview",
}: BookingErrorStateProps) => {
  const details = isBookingApiError(error) ? error : undefined;
  const message = details ? codeLabel[details.code] ?? details.message : "Die Buchungsdaten konnten nicht geladen werden.";

  return (
    <section className="mx-auto w-full max-w-5xl p-4">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-950 shadow-sm">
        <div className="flex items-center gap-3">
          <AlertTriangleIcon className="size-5" />
          <h2 className="text-xl font-semibold">{titleLabel[scope]}</h2>
        </div>
        <p className="mt-3 text-sm">{message}</p>
        {details?.status ? (
          <p className="mt-2 text-xs text-red-800">HTTP-Status: {details.status}</p>
        ) : null}
        {onRetry ? (
          <Button variant="outline" className="mt-4 gap-2" onClick={onRetry}>
            <RefreshCcwIcon className="size-4" />
            Erneut laden
          </Button>
        ) : null}
      </div>
    </section>
  );
};
