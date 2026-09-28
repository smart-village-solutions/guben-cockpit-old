export const buildplaceMapUrl = (geodataview: string) =>
  `https://public.buildplace.io/_/stadt-guben/portfolio/-/overview/map?activeLocation=no-location&geodataview=${geodataview}&mapview=11.77/51.943175/14.683025/0.00/0.00&sidemode=portfolioGeoData`;

export const buildplaceMapOverviewUrl = buildplaceMapUrl("VCLRxcYi93GPjoPP9DFKL");

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
