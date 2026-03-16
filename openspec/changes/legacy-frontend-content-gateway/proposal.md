## Why

Das bestehende `frontend/` soll weiterverwendet werden, gleichzeitig darf der GraphQL-API-Key des externen CMS nicht im Browser landen. Daher wird eine leichte serverseitige Gateway-Schicht benötigt, die das alte Frontend beibehält und den sicheren CMS-Zugriff kapselt.

Zusaetzlich soll fuer datenbankbasierte Inhalte eine standardisierte API-Schicht eingefuehrt werden, damit das Frontend kontrolliert ueber das neue Backend auf PostgreSQL-Daten zugreifen kann, ohne .NET-Endpunkte oder direkte DB-Zugriffe aus dem Browser.

## What Changes

- Das bestehende Vite/React-Frontend bleibt die primäre UI und konsumiert keine direkten CMS-Credentials.
- Einführung eines neuen TypeScript-Content-Gateways als Server-Komponente zwischen Frontend und externer GraphQL-API.
- Einführung von PostgREST als read-only Daten-Fassade auf PostgreSQL fuer oeffentliche, tabellarische Inhalte.
- Neue öffentliche Content-Endpunkte im Gateway für Home, Projekte, Events, Karte, Dashboard und Footer.
- Neue/angepasste Backend-Endpunkte im Gateway, die PostgREST-Antworten in stabile Frontend-View-Modelle ueberfuehren.
- Einheitliche Fehlerantworten bei CMS-Ausfall, die im Frontend deterministisch angezeigt werden.
- Einführung einer SEO-Strategie für das Legacy-Frontend (Prerender/SSR-fähige Auslieferung für öffentliche Routen).
- **BREAKING**: Direkte Content-Abhängigkeit des Frontends an das bisherige interne .NET-CMS-Backend entfällt für öffentliche Inhalte.

## Capabilities

### New Capabilities
- `legacy-frontend-content-gateway`: Das bestehende Frontend bezieht öffentliche Inhalte über ein neues internes Gateway.
- `server-side-cms-key-protection`: CMS-API-Key wird ausschließlich serverseitig im Gateway verwendet.
- `legacy-frontend-content-adapter`: Gateway normalisiert CMS-GraphQL-Daten in stabile Frontend-View-Modelle.
- `postgrest-read-facade`: PostgreSQL-Inhalte werden ueber PostgREST als kontrollierte read-only API bereitgestellt.
- `legacy-frontend-seo-delivery`: Öffentliche Legacy-Routen werden SEO-freundlich ausgeliefert (Prerender/SSR-Strategie).
- `cms-outage-response-contract`: Einheitlicher Fehlervertrag zwischen Gateway und Frontend bei Upstream-Ausfällen.

### Modified Capabilities
- _Keine bestehenden Capabilities vorhanden._

## Impact

- Neuer Service/Ordner für Gateway-Code inklusive Deployment-Konfiguration.
- Neuer PostgREST-Service inkl. DB-Rollen, freigegebener Schema/View-Definitionen und Sicherheitskonfiguration.
- Anpassungen in `frontend/` beim Datenzugriff und Error-Handling.
- CI/CD wird um Gateway- und PostgREST-Checks inklusive Integrationspruefungen erweitert.
- Betriebsseitig neue Secret-Verwaltung (`CMS_GRAPHQL_URL`, `CMS_API_KEY`) und Monitoring für Upstream-Fehler.
