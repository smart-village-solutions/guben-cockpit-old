export const buildplaceMapUrl = (geodataview: string) =>
  `https://public.buildplace.io/_/stadt-guben/portfolio/-/overview/map?geodataview=${geodataview}&layerOrder=geoDataLayer,xPlanLayer&mapview=13.67/51.951171/14.702273/0.00/0.00&sidemode=portfolioGeoData&activeLocation=no-location`;

export const buildplaceMapOverviewUrl = buildplaceMapUrl("Q0eIRLhq8q7PXzRujP7sv");

export const buildplaceMapUrlByCanonicalTitle: Record<string, string> = {
  euroregion: buildplaceMapUrl("OgBlQ3t5LyqT3jiOe9n0t"),
  "guben-gubin": buildplaceMapUrl("ZM98Cpw2zk1V_ubb8N7Ex"),
  stadtentwicklung: buildplaceMapUrl("XB8lHHMfITxvf_0QGDrve"),
  "stadtentwicklung & teilhabe": buildplaceMapUrl("XB8lHHMfITxvf_0QGDrve"),
  energie: buildplaceMapUrl("YL787UBfwoBD0jsepOyTu"),
  "energie & wirtschaft": buildplaceMapUrl("YL787UBfwoBD0jsepOyTu"),
  kinder: buildplaceMapUrl("wlFzNKnN44qombPDU0YKc"),
  "kinder & jugend": buildplaceMapUrl("wlFzNKnN44qombPDU0YKc"),
  senioren: buildplaceMapUrl("xhph1SnqNaFnyzojaapSx"),
  tourismus: buildplaceMapUrl("DJ3cImoMtX1h-RP9nvc6v"),
  "tourismus & mobilität": buildplaceMapUrl("DJ3cImoMtX1h-RP9nvc6v"),
  umwelt: buildplaceMapUrl("urVhNhQ6SlWLjS-G-jbs6"),
  "gefahrenabwehr & umwelt": buildplaceMapUrl("urVhNhQ6SlWLjS-G-jbs6"),
};

const normalizeCanonicalTitle = (title: string) => title.trim().toLowerCase();

export const resolveBuildplaceMapUrl = (canonicalTitle: string, fallbackUrl: string) =>
  buildplaceMapUrlByCanonicalTitle[normalizeCanonicalTitle(canonicalTitle)] ?? fallbackUrl;
