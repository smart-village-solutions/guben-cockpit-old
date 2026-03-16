import { InfoIcon } from "lucide-react";

export const PublicContentDisabledState = () => (
  <section className="mx-auto max-w-5xl p-8">
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-slate-950 shadow-sm">
      <div className="flex items-center gap-3">
        <InfoIcon className="size-6" />
        <h1 className="text-2xl font-semibold">Oeffentliche Inhalte aktuell deaktiviert</h1>
      </div>
      <p className="mt-3 text-base">
        Dieser Bereich ist fuer diese Auslieferung bewusst abgeschaltet und stellt keine
        Gateway-Anfragen.
      </p>
    </div>
  </section>
);
