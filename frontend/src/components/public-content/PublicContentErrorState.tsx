import { AlertTriangleIcon, RefreshCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { isGatewayRequestError } from "@/public-content/client";

interface Props {
  error: unknown;
  onRetry?: () => void;
}

const codeLabel: Record<string, string> = {
  UPSTREAM_TIMEOUT: "Die öffentliche Inhaltsquelle antwortet aktuell zu langsam.",
  UPSTREAM_UNAVAILABLE: "Die öffentliche Inhaltsquelle ist aktuell nicht erreichbar.",
  INVALID_UPSTREAM_PAYLOAD: "Die Inhaltsdaten sind aktuell unvollständig oder fehlerhaft.",
  NOT_FOUND: "Der angeforderte Inhalt wurde nicht gefunden.",
  INTERNAL_ERROR: "Im Content Gateway ist ein Fehler aufgetreten.",
};

export const PublicContentErrorState = ({ error, onRetry }: Props) => {
  const details = isGatewayRequestError(error) ? error.details : undefined;
  const message = details ? codeLabel[details.code] ?? details.message : "Die Inhalte konnten nicht geladen werden.";

  return (
    <section className="mx-auto max-w-5xl p-8">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-red-950 shadow-sm">
        <div className="flex items-center gap-3">
          <AlertTriangleIcon className="size-6" />
          <h1 className="text-2xl font-semibold">Inhalte aktuell nicht verfügbar</h1>
        </div>
        <p className="mt-3 text-base">{message}</p>
        {details && (
          <p className="mt-2 text-sm text-red-800">
            Fehlercode: {details.code} · Request-ID: {details.requestId}
          </p>
        )}
        {onRetry && (
          <Button variant="outline" className="mt-6 gap-2" onClick={onRetry}>
            <RefreshCcwIcon className="size-4" />
            Erneut laden
          </Button>
        )}
      </div>
    </section>
  );
};
