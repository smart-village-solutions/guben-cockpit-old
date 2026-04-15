import { AlertTriangleIcon, RefreshCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import type { BookingApiError } from "@/booking-api/errors";
import { isBookingApiError } from "@/booking-api/errors";

type BookingErrorStateProps = {
  error: unknown;
  onRetry?: () => void;
  scope?: "overview" | "detail" | "availability";
};

export const BookingErrorState = ({
  error,
  onRetry,
  scope = "overview",
}: BookingErrorStateProps) => {
  const { t } = useTranslation("booking");
  const details = isBookingApiError(error) ? error : undefined;
  const title = t(`errorState.title.${scope}`);
  const message = details
    ? t(`errorState.code.${details.code}`, { defaultValue: details.message })
    : t("errorState.code.default");
  const showRetry = Boolean(onRetry && (!details || details.retryable));

  return (
    <section className="mx-auto w-full max-w-5xl p-4">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-950 shadow-sm">
        <div className="flex items-center gap-3">
          <AlertTriangleIcon className="size-5" />
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
        <p className="mt-3 text-sm">{message}</p>
        {details?.status ? (
          <p className="mt-2 text-xs text-red-800">{t("errorState.httpStatus", { status: details.status })}</p>
        ) : null}
        {showRetry ? (
          <Button variant="outline" className="mt-4 gap-2" onClick={onRetry}>
            <RefreshCcwIcon className="size-4" />
            {t("errorState.retry")}
          </Button>
        ) : null}
      </div>
    </section>
  );
};
