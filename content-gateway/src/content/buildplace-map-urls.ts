export const buildplaceMapOverviewUrl =
  "https://public.buildplace.io/_/stadt-guben/portfolio/-/overview/map?geodataview=Q0eIRLhq8q7PXzRujP7sv&layerOrder=geoDataLayer,xPlanLayer&mapview=13.67/51.951171/14.702273/0.00/0.00&sidemode=portfolioGeoData&activeLocation=no-location";

export const buildplaceMapUrlByCanonicalTitle: Record<string, string> = {
  stadtentwicklung:
    "https://public.buildplace.io/_/stadt-guben/portfolio/-/overview/map?geodataview=XB8lHHMfITxvf_0QGDrve&layerOrder=geoDataLayer,xPlanLayer&mapview=13.67/51.951171/14.702273/0.00/0.00&sidemode=portfolioGeoData&activeLocation=no-location",
  energie:
    "https://public.buildplace.io/_/stadt-guben/portfolio/-/overview/map?geodataview=YL787UBfwoBD0jsepOyTu&layerOrder=geoDataLayer,xPlanLayer&mapview=13.67/51.951171/14.702273/0.00/0.00&sidemode=portfolioGeoData&activeLocation=no-location",
  kinder:
    "https://public.buildplace.io/_/stadt-guben/portfolio/-/overview/map?geodataview=wlFzNKnN44qombPDU0YKc&layerOrder=geoDataLayer,xPlanLayer&mapview=13.67/51.951171/14.702273/0.00/0.00&sidemode=portfolioGeoData&activeLocation=no-location",
  senioren:
    "https://public.buildplace.io/_/stadt-guben/portfolio/-/overview/map?geodataview=xhph1SnqNaFnyzojaapSx&layerOrder=geoDataLayer,xPlanLayer&mapview=13.67/51.951171/14.702273/0.00/0.00&sidemode=portfolioGeoData&activeLocation=no-location",
  tourismus:
    "https://public.buildplace.io/_/stadt-guben/portfolio/-/overview/map?geodataview=DJ3cImoMtX1h-RP9nvc6v&layerOrder=geoDataLayer,xPlanLayer&mapview=13.67/51.951171/14.702273/0.00/0.00&sidemode=portfolioGeoData&activeLocation=no-location",
  umwelt:
    "https://public.buildplace.io/_/stadt-guben/portfolio/-/overview/map?geodataview=urVhNhQ6SlWLjS-G-jbs6&layerOrder=geoDataLayer,xPlanLayer&mapview=13.67/51.951171/14.702273/0.00/0.00&sidemode=portfolioGeoData&activeLocation=no-location",
};

const normalizeCanonicalTitle = (title: string) => title.trim().toLowerCase();

export const resolveBuildplaceMapUrl = (canonicalTitle: string, fallbackUrl: string) =>
  buildplaceMapUrlByCanonicalTitle[normalizeCanonicalTitle(canonicalTitle)] ?? fallbackUrl;
