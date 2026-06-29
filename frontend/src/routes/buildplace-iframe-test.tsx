import { createFileRoute } from "@tanstack/react-router";

export const buildplaceMapUrl =
  "https://public.buildplace.io/_/stadt-guben/portfolio/-/overview/map?geodataview=DJ3cImoMtX1h-RP9nvc6v&sidemode=portfolioGeoData&mapview=12.36/51.950949/14.672676/0.00/0.00&layerOrder=geoDataLayer,xPlanLayer";

export const Route = createFileRoute("/buildplace-iframe-test")({
  component: BuildplaceIframeTestRoute,
});

function BuildplaceIframeTestRoute() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 pb-8">
      <h1 className="font-poppins text-3xl font-bold text-gubenAccent">Buildplace Map iframe Test</h1>

      <section className="mt-4 rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
        <p className="leading-7 text-slate-700">
          Diese Seite testet die Einbettung von <code className="break-all rounded-md bg-slate-100 px-2 py-1">{buildplaceMapUrl}</code>.
        </p>
        <p className="mt-3 leading-7 text-slate-700">
          Falls die Einbettung blockiert wird, bleibt der Inhalt im iframe leer oder der Browser zeigt eine Fehlermeldung.
        </p>
        <p className="mt-3 leading-7 text-slate-700">
          Direkter Link:{" "}
          <a className="text-gubenAccent underline" href={buildplaceMapUrl} target="_blank" rel="noreferrer">
            public.buildplace.io/_/stadt-guben/portfolio/-/overview/map
          </a>
        </p>
      </section>

      <iframe
        className="mt-6 min-h-[80vh] w-full flex-1 rounded-xl border border-slate-300 bg-white"
        src={buildplaceMapUrl}
        title="Buildplace iframe test"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </main>
  );
}
